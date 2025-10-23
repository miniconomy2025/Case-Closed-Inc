import React, { useState, useEffect } from 'react';
import api from "../utils/httpClient";
import { useQuery } from '@tanstack/react-query';

type ExternalOrder = {
  order_id: number;
  order_reference: string;
  total_cost: number;
  shipment_reference: string | null;
  ordered_at: string;
  received_at: string | null;
  type_id: number;
  type_name: string;
};

type ExternalOrderStats = {
  totalExternalOrders: number;
  pending_delivery: number;
  delivered: number;
  material_order: number;
  machine_order: number;
  totalCost: number;
};

// --- Fetch orders + stats concurrently ---
const fetchOrdersAndStats = async () => {
  const [ordersRes, statsRes] = await Promise.all([
    api.get("/external-orders"),
    api.get("/external-orders/stats")
  ]);
  return { orders: ordersRes, stats: statsRes };
};

const useOrdersAndStats = () =>
  useQuery({
    queryKey: ["external-orders-and-stats"],
    queryFn: fetchOrdersAndStats,
    refetchInterval: 3000
  });

const ExternalOrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<ExternalOrder[]>([]);
  const [stats, setStats] = useState<ExternalOrderStats | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ExternalOrder | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading: loading, error } = useOrdersAndStats();

  useEffect(() => {
    if (data) {
      setOrders(data.orders);
      // Convert string numbers to real numbers
      const s = data.stats;
      setStats({
        totalExternalOrders: Number(s.totalExternalOrders),
        pending_delivery: Number(s.pending_delivery),
        delivered: Number(s.delivered),
        material_order: Number(s.material_order),
        machine_order: Number(s.machine_order),
        totalCost: Number(s.totalCost)
      });
    }
  }, [data]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div style={loadingStyle}>Loading external orders...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center' }}>Failed to load orders.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* --- Stats Cards --- */}
      {stats && (
        <div style={statsGrid}>
          <div style={cardStyle}>
            <h3 style={{ color: '#1976d2' }}>Total Orders</h3>
            <p style={valueStyle}>{stats.totalExternalOrders}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ color: '#4caf50' }}>Delivered</h3>
            <p style={valueStyle}>{stats.delivered}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ color: '#2196f3' }}>Material Orders</h3>
            <p style={valueStyle}>{stats.material_order}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ color: '#9c27b0' }}>Machine Orders</h3>
            <p style={valueStyle}>{stats.machine_order}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ color: '#388e3c' }}>Total Cost</h3>
            <p style={valueStyle}>Ð {stats.totalCost.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* --- Orders Table --- */}
      <div style={tableWrapper}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1976d2' }}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Order Reference</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Total Cost</th>
              <th style={thStyle}>Shipment Ref</th>
              <th style={thStyle}>Ordered At</th>
              <th style={thStyle}>Received At</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.order_id} style={rowStyle}>
                <td style={tdStyle}>#{order.order_id}</td>
                <td style={tdStyle}>{order.order_reference}</td>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#1976d2' }}>
                  {order.type_name}
                </td>
                <td style={{ ...tdStyle, color: '#2e7d32', fontWeight: 'bold' }}>
                  Ð {order.total_cost.toFixed(2)}
                </td>
                <td style={tdStyle}>{order.shipment_reference || 'N/A'}</td>
                <td style={tdStyle}>{formatDate(order.ordered_at)}</td>
                <td style={tdStyle}>{formatDate(order.received_at)}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowModal(true);
                    }}
                    style={detailsButtonStyle}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Modal --- */}
      {showModal && selectedOrder && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginBottom: '20px', color: '#1976d2' }}>
              External Order #{selectedOrder.order_id}
            </h2>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Order Reference:</strong> {selectedOrder.order_reference}</p>
              <p><strong>Type:</strong> {selectedOrder.type_name}</p>
              <p><strong>Total Cost:</strong> Ð {selectedOrder.total_cost.toFixed(2)}</p>
              <p><strong>Shipment Ref:</strong> {selectedOrder.shipment_reference || 'N/A'}</p>
              <p><strong>Ordered At:</strong> {formatDate(selectedOrder.ordered_at)}</p>
              <p><strong>Received At:</strong> {formatDate(selectedOrder.received_at)}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setShowModal(false)} style={closeButtonStyle}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const loadingStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '400px',
  fontSize: '18px',
  color: '#666'
};

const statsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  marginBottom: '30px'
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  padding: '15px',
  borderRadius: '12px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
};

const valueStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#333'
};

const tableWrapper: React.CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  overflow: 'hidden'
};

const thStyle: React.CSSProperties = {
  padding: '16px',
  color: 'white',
  textAlign: 'left'
};

const tdStyle: React.CSSProperties = {
  padding: '16px'
};

const rowStyle: React.CSSProperties = {
  borderBottom: '1px solid #e0e0e0'
};

const detailsButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#4caf50',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.875rem'
};

const closeButtonStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#1976d2',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer'
};

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '30px',
  maxWidth: '600px',
  width: '90%',
  maxHeight: '80vh',
  overflow: 'auto'
};

export default ExternalOrdersTable;
