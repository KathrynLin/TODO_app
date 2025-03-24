# 📝 TODO App – Full Stack Task Manager

This is a full-stack TODO application that allows users to manage tasks with authentication, filtering, calendar view, and more. Built using **React** for the frontend and **Node.js (Express)** for the backend, with **MongoDB** as the database. It is designed for easy local development and deployment on a cloud environment like AWS EC2.

---

## Project Structure

```
TODO_app/
├── todo-frontend/       # React frontend (Create React App)
├── todo-backend/        # Express backend with JWT auth & MongoDB
└── README.md            # Project documentation
```

---

## Features

- **User Authentication**: Register & login with JWT token.
- **CRUD Operations**: Create, Read, Update, Delete tasks.
- **Filtering**: Filter by category, priority, search keyword.
- **Sorting**: Sort tasks by due date, priority, or created time.
- **Calendar View**: View tasks by day/month using a calendar.
- **Pagination**: Server-side pagination for better performance.
- **Task Completion Toggle**
- **Bulk Delete Tasks**
- **Deployed on AWS EC2**

---

## Tech Stack

| Layer       | Technology             |
|-------------|------------------------|
| Frontend    | React, Bootstrap, Axios |
| Backend     | Node.js, Express       |
| Database    | MongoDB (via Mongoose) |
| Auth        | JWT (JSON Web Token)   |
| Deployment  | AWS EC2 + tmux         |

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/TODO_app.git
cd TODO_app
```

---

### 2. Backend Setup

```bash
cd todo-backend
npm install
```

Create a `.env` file inside `todo-backend/` with the following:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_very_secure_secret
```

Start the backend:

```bash
node server.js
```

The backend will run at `http://localhost:5000`

---

### 3. Frontend Setup

```bash
cd ../todo-frontend
npm install
```

Create a `.env` file inside `todo-frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm start
```

The app will run at `http://localhost:3000`

---

## 🚀 Deployment Guide (AWS EC2 + tmux)

### Prerequisites:

- Node.js and npm installed on EC2
- MongoDB Atlas URI (or MongoDB running)
- EC2 instance with public IP and security group allowing ports 3000, 5000

---

### 1. Clone & Install on EC2

```bash
ssh ubuntu@your-ec2-ip
git clone https://github.com/your-username/TODO_app.git
cd TODO_app
```

Install dependencies:

```bash
cd todo-backend && npm install
cd ../todo-frontend && npm install && npm run build
```

---

### 2. Environment Variables

**Backend (`todo-backend/.env`)**

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

**Frontend (`todo-frontend/.env`)**

```env
REACT_APP_API_URL=http://your-ec2-ip:5000/api
```

---

### 3. Run with tmux

Install `tmux` if not installed:

```bash
sudo apt update && sudo apt install tmux
```

Start backend in a tmux session:

```bash
tmux new -s backend
cd ~/TODO_app/todo-backend
node server.js
# Detach with Ctrl+B, then D
```

Start frontend in another session:

```bash
tmux new -s frontend
cd ~/TODO_app/todo-frontend
npx serve -s build -l 3000
# Detach again
```

Now your app is accessible via:

- Frontend: `http://your-ec2-ip:3000`
- Backend: `http://your-ec2-ip:5000/api`

---

## Demo Video
Check out the full video at YouTube. You can also play around my app at: https://todo.fangqinglin.com/login

[![Watch the demo](https://img.youtube.com/vi/TSq4lcUaOKg/0.jpg)](https://www.youtube.com/watch?v=TSq4lcUaOKg)


## Testing Tips

1. Register a new user
2. Login to get JWT token
3. Add new tasks (title, category, priority, due date)
4. Use filters and sorting
5. View tasks on Calendar
6. Try completing & deleting tasks
7. Test pagination and bulk delete



## Last Updated

March 23, 2025

## License

Fangqing Lin © 2025
