export default function Card({ children, className = "", padding = true }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}