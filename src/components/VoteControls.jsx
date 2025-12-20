// src/components/VoteControls.jsx
import './VoteControls.css';

function VoteControls({ report, onVote, userId }) {
  // If user is guest, show numbers but disable buttons
  const isGuest = !userId;

  return (
    <div className="vote-container">
      <div className="vote-section">
        <button 
          className="vote-btn confirm" 
          onClick={() => onVote(report.id, 'confirm')}
          disabled={isGuest}
        >
          👍 Verify
        </button>
        <span className="vote-count confirm-text">{report.confirmVotes || 0}</span>
      </div>

      <div className="vote-section">
        <button 
          className="vote-btn deny" 
          onClick={() => onVote(report.id, 'deny')}
          disabled={isGuest}
        >
          👎 Fake
        </button>
        <span className="vote-count deny-text">{report.denyVotes || 0}</span>
      </div>
      
      {isGuest && <small className="guest-warning">Login to vote</small>}
    </div>
  );
}

export default VoteControls;