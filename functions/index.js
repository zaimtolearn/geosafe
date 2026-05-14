// functions/index.js (Updated for v2 & Twilio)
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall } = require("firebase-functions/v2/https"); // NEW: For callable functions
const admin = require("firebase-admin");
const geofire = require("geofire-common");
const twilio = require('twilio'); // NEW: Twilio

admin.initializeApp();
const db = admin.firestore();

// Optional: Set region (us-central1 is default/cheapest)
setGlobalOptions({ region: "us-central1" });

// ==========================================
// FUNCTION 1: FCM WEB PUSH NOTIFICATIONS
// ==========================================
exports.sendGeoAlert = onDocumentWritten("reports/{reportId}", async (event) => {
    // 1. Setup Data Access (New v2 Syntax)
    const newData = event.data && event.data.after ? event.data.after.data() : null;
    const oldData = event.data && event.data.before ? event.data.before.data() : null;

    if (!newData) return null;

    // Normalizing status for backwards compatibility in the backend
    const isVerified = newData.status === "Confirmed" || newData.status === "Verified by Admin" || newData.status === "Verified by Community";
    const wasVerified = oldData && (oldData.status === "Confirmed" || oldData.status === "Verified by Admin" || oldData.status === "Verified by Community");

    // Stop if not verified, or if it was ALREADY verified previously
    if (!isVerified) return null;
    if (wasVerified) return null;

    console.log(`Processing Alert for: ${newData.title}`);

    const reportLat = newData.location.lat;
    const reportLng = newData.location.lng;
    const center = [reportLat, reportLng];
    const radiusInM = 5 * 1000; // 5km search radius

    // 2. Geohash Query Logic
    const bounds = geofire.geohashQueryBounds(center, radiusInM);
    const promises = [];

    for (const b of bounds) {
      const q = db.collection("users")
        .orderBy("alertConfig.geohash")
        .startAt(b[0])
        .endAt(b[1]);
      promises.push(q.get());
    }

    const snapshots = await Promise.all(promises);
    const tokensToSend = [];

    // 3. Filter results
    snapshots.forEach((snap) => {
      snap.forEach((doc) => {
        const user = doc.data();
        if (user.fcmToken && user.alertConfig && user.alertConfig.enabled) {
          
          // Check Category Subscriptions!
          const userCategories = user.alertConfig.categories || {};
          if (userCategories[newData.category] === false) return; // User opted out of this category

          const userLat = user.alertConfig.location.lat;
          const userLng = user.alertConfig.location.lng;
          
          const distanceInKm = geofire.distanceBetween([userLat, userLng], center);
          
          if (distanceInKm <= (user.alertConfig.radius || 5)) {
            tokensToSend.push(user.fcmToken);
          }
        }
      });
    });

    // 4. Send the Batch Message
    if (tokensToSend.length > 0) {
      const message = {
        notification: {
          title: "⚠️ DANGER VERIFIED",
          body: `${newData.title} is ${newData.category} near your location!`,
        },
        data: {
          url: `https://${process.env.GCLOUD_PROJECT}.web.app/` 
        },
        tokens: tokensToSend,
        
        android: { ttl: 600 * 1000, priority: 'high' },
        webpush: { headers: { TTL: "600" } },
        apns: { payload: { aps: { expiration: Math.floor(Date.now() / 1000) + 600 } } }
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log("Notifications sent:", response.successCount);
    } else {
        console.log("No matching users found nearby.");
    }
});


// ==========================================
// FUNCTION 2: TWILIO WHATSAPP ALERTS
// ==========================================
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);
const TWILIO_SANDBOX_NUMBER = 'whatsapp:+14155238886'; // Change if your Twilio sandbox number is different

exports.sendWhatsAppAlert = onCall(async (request) => {
    // Note: v2 uses request.data
    const phone = request.data.phone;
    const message = request.data.message;

    if (!phone) return { success: false, error: "No phone number provided" };

    const cleanPhone = phone.replace(/[^0-9+]/g, '');

    try {
        const response = await client.messages.create({
            body: message,
            from: TWILIO_SANDBOX_NUMBER,
            to: `whatsapp:${cleanPhone}`
        });
        console.log("WhatsApp sent successfully:", response.sid);
        return { success: true, messageId: response.sid };
    } catch (error) {
        console.error("Twilio Error:", error);
        return { success: false, error: error.message }; 
    }
});