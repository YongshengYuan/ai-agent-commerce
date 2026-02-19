export default function Home() {
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🤖 AI-Agent Shop</h1>
      <p>AI-Agent友好的跨境电商独立站</p>
      
      <div style={{ marginTop: '40px' }}>
        <h2>热门商品</h2>
        
        <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>智能手表 Pro</h3>
            <p>支持AI语音助手的智能手表</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#e53935' }}>$299.99</p>
            <button style={{ 
              padding: '10px 20px', 
              background: '#1976d2', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              加入购物车
            </button>
          </div>

          <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>无线耳机 Max</h3>
            <p>降噪无线耳机，AI音质优化</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#e53935' }}>$199.99</p>
            <button style={{ 
              padding: '10px 20px', 
              background: '#1976d2', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              加入购物车
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🤖 AI购物助手</h3>
        <p>支持自然语言购物：</p>
        <ul>
          <li>"我想买一款智能手表"</li>
          <li>"推荐一款降噪耳机"</li>
          <li>"查看我的购物车"</li>
          <li>"帮我下单"</li>
        </ul>
        <p><strong>MCP协议端点</strong>: /api/mcp</p>
      </div>
    </div>
  );
}
