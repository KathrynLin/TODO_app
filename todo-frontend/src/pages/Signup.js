import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const schema = yup.object().shape({
  username: yup.string().required("Username is required").min(3, "Username must be at least 3 characters"),
  email: yup.string().email("Please enter a valid email").required("Email is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

function Signup() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data) => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", data);
      // 注册成功后自动登录
      const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
        email: data.email,
        password: data.password,
      });
      login(loginRes.data.token);
      navigate("/todo");
    } catch (error) {
      alert("Registration failed: " + (error.response?.data?.message || "Please check your input"));
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: "400px" }}>
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <input 
            type="text" 
            className="form-control" 
            placeholder="Username" 
            {...register("username")} 
          />
          <p className="text-danger">{errors.username?.message}</p>
        </div>
        <div className="mb-3">
          <input 
            type="email" 
            className="form-control" 
            placeholder="Email" 
            {...register("email")} 
          />
          <p className="text-danger">{errors.email?.message}</p>
        </div>
        <div className="mb-3">
          <input 
            type="password" 
            className="form-control" 
            placeholder="Password" 
            {...register("password")} 
          />
          <p className="text-danger">{errors.password?.message}</p>
        </div>
        <button className="btn btn-primary w-100" type="submit">
          Sign Up
        </button>
        <div className="text-center mt-3">
          <span>Already have an account? </span>
          <a href="/login" className="text-primary">Login</a>
        </div>
      </form>
    </div>
  );
}

export default Signup;
