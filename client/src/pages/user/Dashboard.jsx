import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
const Dashboard = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const goToProfile = () => {
    navigate("/profile");
  };
  useEffect(() => {
    const getUser = async () => {
      const response = await fetch(`${baseUrl}/api/auth/get-user`, {
        credentials: "include",
      });
      const data = await response.json();
      if (!data.status) {
        navigate("/login");
      }
      setUser(data.user);
    };
    getUser();
  }, []);
  if (!user) {
    return <>Loading...</>;
  }
  return (
    <div>
      <h1>Welcome: {user.name}</h1>
      <h1>Email: {user.email}</h1>
      <button onClick={goToProfile} className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-md hover:bg-green-700 transition"
      >Profile</button>
    </div>
  );
};

export default Dashboard;
