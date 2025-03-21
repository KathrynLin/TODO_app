import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const schema = yup.object().shape({
  username: yup.string().required("用户名不能为空").min(3, "用户名至少3个字符"),
  email: yup.string().email("请输入有效的邮箱").required("邮箱不能为空"),
  password: yup.string().min(6, "密码至少6个字符").required("密码不能为空"),
});

function Signup() {
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: yupResolver(schema) });
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await axios.post("http://localhost:5000/api/auth/register", data);
      alert("注册成功，请登录！");
      navigate("/login");
    } catch (error) {
      alert("注册失败：" + (error.response?.data?.message || "请检查输入信息"));
    }
  };

  return (
    <div className="container mt-5">
      <h2>注册</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <input type="text" className="form-control" placeholder="用户名" {...register("username")} />
          <p className="text-danger">{errors.username?.message}</p>
        </div>
        <div className="mb-3">
          <input type="email" className="form-control" placeholder="邮箱" {...register("email")} />
          <p className="text-danger">{errors.email?.message}</p>
        </div>
        <div className="mb-3">
          <input type="password" className="form-control" placeholder="密码" {...register("password")} />
          <p className="text-danger">{errors.password?.message}</p>
        </div>
        <button className="btn btn-primary" type="submit">注册</button>
      </form>
    </div>
  );
}

export default Signup;
