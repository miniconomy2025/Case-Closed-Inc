import React, { useState, useEffect } from 'react';
import api from "../utils/httpClient";
import { useQuery } from '@tanstack/react-query';

type CaseOrder = {
  order_id: number;
  quantity: number;
  quantity_delivered: number;
  total_price: number;
  amount_paid: number;
  account_number: string | null;
  ordered_at: string;
  status_id: number;
  status_name: string;
};

type OrderStats = {
  totalOrders: number;
  pendingPayment: number;
  pendingPickup: number;
  completed: number;
  totalRevenue: number;
  avgOrderValue: number;
};

  const fetchOrdersAndStats = async () => {
    const [orders, stats] = await Promise.all([
      api.get("/case/orders"),
      api.get("/case/orders/stats")
    ]);
    return { orders, stats };
  };

const useOrdersAndStats = () =>
  useQuery({
    queryKey: ["orders-and-stats"],
    queryFn: fetchOrdersAndStats,
    refetchInterval: 3000
  });

const PhoneCaseOrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<CaseOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  //const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<CaseOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { data, isLoading: loading, error } = useOrdersAndStats();

  useEffect(() => {
   if (data) {
     setOrders(data.orders)
     setStats(data.stats)
   }
  }, [data]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'payment_pending': return '#ff9800';
      case 'pickup_pending': return '#2196f3';
      case 'order_complete': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'payment_pending': return 'Payment Pending';
      case 'pickup_pending': return 'Pickup Pending';
      case 'order_complete': return 'Complete';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading orders...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={cardStyle}>
            <h3 style={{ color: '#1976d2' }}>Total Orders</h3>
            <p style={valueStyle}>{stats.totalOrders}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ color: '#ff9800' }}>Payment Pending</h3>
            <p style={valueStyle}>{stats.pendingPayment}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ color: '#2196f3' }}>Pickup Pending</h3>
            <p style={valueStyle}>{stats.pendingPickup}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ color: '#4caf50' }}>Completed</h3>
            <p style={valueStyle}>{stats.completed}</p>
          </div>
          <div style={cardStyle}>
            <h3 style={{ color: '#4caf50' }}>Total Revenue</h3>
            <p style={valueStyle}>Ð {stats.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1976d2' }}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Ordered At</th>
              <th style={thStyle}>Quantity</th>
              <th style={thStyle}>Total Price</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.order_id} style={rowStyle}>
                <td style={tdStyle}>#{order.order_id}</td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: getStatusColor(order.status_name) + '20',
                    color: getStatusColor(order.status_name),
                    border: `1px solid ${getStatusColor(order.status_name)}40`
                  }}>
                    {getStatusText(order.status_name)}
                  </span>
                </td>
                <td style={tdStyle}>{order.ordered_at}</td>
                <td style={tdStyle}>{order.quantity} items</td>
                <td style={{ ...tdStyle, fontWeight: 'bold', color: '#2e7d32' }}>
                  Ð {order.total_price.toFixed(2)}
                </td>
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

      {/* Modal */}
      {showModal && selectedOrder && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginBottom: '20px', color: '#1976d2' }}>
              Order #{selectedOrder.order_id} Details
            </h2>
            <div style={{ marginBottom: '20px' }}>
              <p><strong>Status:</strong> {getStatusText(selectedOrder.status_name)}</p>
              <p><strong>Ordered At:</strong> {formatDate(selectedOrder.ordered_at)}</p>
              <p><strong>Quantity:</strong> {selectedOrder.quantity}</p>
              <p><strong>Total Price:</strong> Ð{selectedOrder.total_price.toFixed(2)}</p>
              <p><strong>Amount Paid:</strong> Ð{selectedOrder.amount_paid.toFixed(2)}</p>
              <p><strong>Account Number:</strong> {selectedOrder.account_number || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setShowModal(false)}
                style={closeButtonStyle}
              >
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

const thStyle: React.CSSProperties = {
  padding: '16px',
  color: 'white',
  textAlign: 'left'
};

const tdStyle: React.CSSProperties = {
  padding: '16px'
};

const rowStyle: React.CSSProperties = {
  borderBottom: '1px solid #e0e0e0',
  transition: 'background-color 0.2s'
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

export default PhoneCaseOrdersTable;
