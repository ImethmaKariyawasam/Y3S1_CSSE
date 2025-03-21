import React from 'react';
import { 
  Calendar, 
  CreditCard, 
  User, 
  Mail, 
  DollarSign, 
  Clock,
  Package,
  Scale,
  Truck
} from 'lucide-react';

const styles = `
  body {
    font-family: 'Roboto', sans-serif;
    margin: 0;
    padding: 20px;
    font-size: 14px;
  }
  .header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #eee;
  }
  .payment-info, .request-info {
    margin: 20px 0;
    padding: 15px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background-color: #f8fafc;
  }
  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 0;
  }
  .info-row svg {
    color: #64748b;
  }
  h1 { font-size: 24px; font-weight: 600; color: #1e293b; }
  h2 { font-size: 18px; font-weight: 500; color: #334155; margin-bottom: 15px; }
  p { margin: 5px 0; color: #475569; }
`;

export const ReportTemplate = ({ payments }) => (
  <html lang="en">
    <head>
      <meta charSet="UTF-8" />
      <title>Payment Status Report</title>
      <link 
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600&display=swap" 
        rel="stylesheet" 
      />
      <style>{styles}</style>
    </head>
    <body>
      <div className="header">
        <h1>Payment Status Report</h1>
        <p>Generated on {new Date().toLocaleDateString("en-GB")}</p>
      </div>
      {payments.map((payment, index) => (
        <div key={index}>
          <PaymentInfoSection payment={payment} />
          <WasteRequestSection request={payment.request} />
        </div>
      ))}
    </body>
  </html>
);

const PaymentInfoSection = ({ payment }) => (
  <div className="payment-info">
    <h2>Payment Details</h2>
    <div className="info-row">
      <User size={16} />
      <p><strong>User:</strong> {payment?.user?.username}</p>
    </div>
    <div className="info-row">
      <Mail size={16} />
      <p><strong>Email:</strong> {payment?.user?.email}</p>
    </div>
    <div className="info-row">
      <CreditCard size={16} />
      <p><strong>Payment Method:</strong> {payment?.paymentMethod}</p>
    </div>
    <div className="info-row">
      <DollarSign size={16} />
      <p><strong>Amount:</strong> ${payment?.amount.toFixed(2)}</p>
    </div>
    <div className="info-row">
      <Clock size={16} />
      <p><strong>Payment Status:</strong> {payment?.paymentStatus}</p>
    </div>
    <div className="info-row">
      <Calendar size={16} />
      <p><strong>Due Date:</strong> {new Date(payment?.paymentDueDate).toLocaleDateString("en-GB")}</p>
    </div>
    <div className="info-row">
      <Calendar size={16} />
      <p><strong>Payment Date:</strong> {new Date(payment?.paymentDate).toLocaleDateString("en-GB")}</p>
    </div>
  </div>
);

const WasteRequestSection = ({ request }) => (
  <div className="request-info">
    <h2>Waste Request Details</h2>
    <div className="info-row">
      <Package size={16} />
      <p><strong>Category:</strong> {request?.wasteCategory?.name || "N/A"}</p>
    </div>
    <div className="info-row">
      <Scale size={16} />
      <p><strong>Quantity:</strong> {request?.quantity} tons</p>
    </div>
    <div className="info-row">
      <Truck size={16} />
      <p><strong>Pick-Up Date:</strong> {new Date(request?.pickUpDate).toLocaleDateString("en-GB")}</p>
    </div>
  </div>
);