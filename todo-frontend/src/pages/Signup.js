import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async () => {
    try {
      await axios.post("http://localhost:5000/api/register", { username, email, password });
      alert("注册成功，请登录！");
      navigate("/login");
    } catch (error) {
      alert("注册失败，请检查信息是否正确！");
    }
  };

  return (
    <div>
      <h2>注册</h2>
      <input type="text" placeholder="用户名" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="email" placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="密码" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleSignup}>注册</button>
    </div>
  );
}

export default Signup;
