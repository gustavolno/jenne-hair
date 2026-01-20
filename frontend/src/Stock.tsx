import { useEffect, useState } from 'react';
import { api } from './api';
import { Package, Plus, Minus, AlertTriangle, Box } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

export function Stock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', quantity: 0, unit: 'un' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const res = await api.get('/produtos/');
      setProducts(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.quantity < 0) {
      alert("Preencha o nome e uma quantidade válida.");
      return;
    }

    try {
      await api.post('/produtos/', newProduct);
      alert("Produto cadastrado com sucesso!");
      setNewProduct({ name: '', quantity: 0, unit: 'un' }); 
      carregarProdutos(); 
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar produto.");
    }
  };

  const handleUse = async (id: number) => {
    try {
      await api.post(`/produtos/${id}/uso?quantidade=1`);
      carregarProdutos(); 
    } catch (error) {
      console.error(error);
      alert("Erro ao dar baixa no estoque.");
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <Package size={24} />
          <h2>Controle de Estoque</h2>
        </div>
      </div>

      {/* Formulário de Cadastro */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <div className="card-title">
            <Plus size={20} style={{ color: 'var(--success)' }} />
            <h3>Cadastrar Novo Produto</h3>
          </div>
        </div>

        <form onSubmit={handleCreate} className="inline-form">
          <div className="form-group flex-2">
            <label className="form-label">Nome do Produto</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="Ex: Shampoo Profissional 5L" 
              value={newProduct.name}
              onChange={e => setNewProduct({...newProduct, name: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quantidade</label>
            <input 
              type="number" 
              className="form-input"
              placeholder="0"
              value={newProduct.quantity}
              onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unidade</label>
            <select 
              className="form-select"
              value={newProduct.unit}
              onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
            >
              <option value="un">Unidade (un)</option>
              <option value="ml">Mililitros (ml)</option>
              <option value="L">Litros (L)</option>
              <option value="kg">Quilos (kg)</option>
              <option value="cx">Caixa (cx)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-success">
            <Plus size={18} />
            Adicionar
          </button>
        </form>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Box size={48} />
            <h3>Nenhum produto cadastrado</h3>
            <p>Adicione produtos para controlar o estoque</p>
          </div>
        </div>
      ) : (
        /* Grid de Produtos */
        <div className="products-grid">
          {products.map(p => (
            <div 
              key={p.id} 
              className={`product-card ${p.quantity < 5 ? 'low-stock' : 'normal-stock'}`}
            >
              <div className="product-header">
                <div className="product-icon">
                  <Package size={20} style={{ color: p.quantity < 5 ? 'var(--danger)' : 'var(--primary)' }} />
                </div>
                {p.quantity < 5 && (
                  <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} />
                    Baixo
                  </span>
                )}
              </div>
              
              <div className="product-name">{p.name}</div>
              <div className="product-id">Código: #{p.id}</div>
              
              <div className="product-footer">
                <div className="product-quantity">
                  <span className="product-quantity-value">{p.quantity}</span>
                  <span className="product-quantity-unit">{p.unit}</span>
                </div>
                
                <button 
                  onClick={() => handleUse(p.id)}
                  className="btn btn-warning btn-icon"
                  title="Usar 1 unidade"
                >
                  <Minus size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}