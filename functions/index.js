// functions/index.js (Updated for v2)
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const geofire = require("geofire-common");

admin.initializeApp();
const db = admin.firestore();

// Optional: Set region (us-central1 is default/cheapest)
setGlobalOptions({ region: "us-central1" });

exports.sendGeoAlert = onDocumentWritten("reports/{reportId}", async (event) => {
    // 1. Setup Data Access (New v2 Syntax)
    // If the document was deleted, 'after' is undefined.
    const newData = event.data && event.data.after ? event.data.after.data() : null;
    const oldData = event.data && event.data.before ? event.data.before.data() : null;

    // Stop if deleted
    if (!newData) return null;

    // Stop if not Confirmed
    if (newData.status !== "Confirmed") return null;
    
    // Optimization: If it was ALREADY confirmed previously, don't send again.
    if (oldData && oldData.status === "Confirmed") return null;

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
        
        // --- NEW: Time-To-Live (TTL) Settings ---
        android: {
          ttl: 600 * 1000, // 10 Minutes (in milliseconds)
          priority: 'high'
        },
        webpush: {
          headers: {
            TTL: "600" // 10 Minutes (in seconds)
          }
        },
        apns: {
            payload: {
                aps: {
                    expiration: Math.floor(Date.now() / 1000) + 600 // UNIX timestamp 10 mins from now
                }
            }
        }
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log("Notifications sent:", response.successCount);
    } else {
        console.log("No matching users found nearby.");
    }
});