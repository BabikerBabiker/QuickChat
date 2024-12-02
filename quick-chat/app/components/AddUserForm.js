import { arrayUnion, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useState } from "react";
import { db } from "../lib/firebase";

export default function AddUserForm({ roomId }) {
  const [username, setUsername] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleAddUser = async (e) => {
    e.preventDefault();

    try {
      const q = query(collection(db, "users"), where("username", "==", username));
      const querySnapshot  = await getDocs(q);

      if (querySnapshot.empty) {
        setError("User not found.");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userId = userDoc.id;

      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, {
        members: arrayUnion(userId),
      });

      setUsername("");
      setSuccess(true);
      setError("");
    } catch (err) {
      setError("Failed to add user. Please try again.");
    }
  };

  return (
    <div>
      <h3>Add User to Room</h3>
      <form onSubmit={handleAddUser}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit">Add User</button>
      </form>
      {success && <p style={{ color: "green" }}>User added successfully!</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
