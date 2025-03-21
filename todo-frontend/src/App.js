import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TodoList from "./pages/TodoList";
import { AuthProvider } from "./context/AuthContext"; // 确保 AuthProvider 包裹了整个应用

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/todo" element={<TodoList />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
