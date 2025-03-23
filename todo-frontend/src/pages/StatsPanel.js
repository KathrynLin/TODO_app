import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Card, Spinner, Container, Row, Col } from "react-bootstrap";
import axios from "axios";

const StatsPanel = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/tasks/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const tasks = res.data.data;

        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;
        const overdue = tasks.filter(t =>
          t.dueDate &&
          !t.completed &&
          new Date(t.dueDate) < new Date()
        ).length;

        setStats({ total, completed, highPriority, overdue });
      } catch (err) {
        setError("Failed to load statistics");
        console.error("Stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllTasks();
  }, [token]);

  const renderStatCard = (title, value, color) => (
    <Col>
      <Card
        className="stat-card h-100"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(0, 0, 0, 0.05)",
          borderRadius: "12px",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          cursor: "default"
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.1)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.06)";
        }}
      >
        <Card.Body className="text-center">
          <div style={{ fontSize: "0.9rem", fontWeight: 500, color: "#555" }}>
            {title}
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: color }}>
            {value}
          </div>
        </Card.Body>
      </Card>
    </Col>
  );

  if (loading) return <Spinner animation="border" />;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(10px)",
        borderRadius: "16px",
        padding: "1.5rem",
        marginTop: "0.5rem",
        marginBottom: "2.5rem",
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)"
      }}
    >
      <h5 className="fw-bold mb-3" style={{ marginTop: "-0.5rem" }}>
        Task Overview
      </h5>
      <Row xs={1} sm={2} md={4} className="g-3">
        {renderStatCard("Total Tasks", stats.total, "#0d6efd")}
        {renderStatCard("Completed", stats.completed, "#198754")}
        {renderStatCard("Overdue", stats.overdue, "#dc3545")}
        {renderStatCard("High Priority", stats.highPriority, "#ffc107")}
      </Row>
    </div>
  );
};

export default StatsPanel;
