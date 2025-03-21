import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext"; // 确保 context 存在
import axios from "axios";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useContext(AuthContext) || { login: () => {} }; // 预防 context 为空
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/login", { username, password });
      login(res.data.token);
      navigate("/todo");
    } catch (error) {
      alert("登录失败，请检查用户名和密码！");
    }
  };

  return (
    <div>
      <h2>登录</h2>
      <input type="text" placeholder="用户名" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin}>登录</button>
    </div>
  );
}

export default Login;
