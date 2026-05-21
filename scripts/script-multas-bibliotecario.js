// ============================================
// SISTEMA DE MULTAS - BIBLIOTECÁRIO
// Gerenciamento completo de multas
// ============================================

// Dados dos usuários e livros
const usuarios = [
    { id: 1, nome: "Ana Martins", matricula: "20241023", email: "ana@escola.edu.br" },
    { id: 2, nome: "Carlos Silva", matricula: "20241045", email: "carlos@escola.edu.br" },
    { id: 3, nome: "Fernanda Lima", matricula: "20240812", email: "fernanda@escola.edu.br" },
    { id: 4, nome: "Roberto Almeida", matricula: "PROF001", email: "roberto@professor.com" },
    { id: 5, nome: "Beatriz Nunes", matricula: "20241103", email: "beatriz@escola.edu.br" },
    { id: 6, nome: "Lucas Andrade", matricula: "20240987", email: "lucas@escola.edu.br" }
  ];
  
  const livros = [
    { id: 1, nome: "O Nome do Vento", valor: 49.90 },
    { id: 2, nome: "Dom Quixote", valor: 59.90 },
    { id: 3, nome: "1984", valor: 39.90 },
    { id: 4, nome: "Duna", valor: 69.90 },
    { id: 5, nome: "O Pequeno Príncipe", valor: 29.90 },
    { id: 6, nome: "Neuromancer", valor: 54.90 }
  ];
  
  // Multas (armazenadas no localStorage)
  let multas = [];
  let multaParaExcluir = null;
  let currentFilter = "all";
  let currentSearch = "";
  
  function carregarMultas() {
    const salvo = localStorage.getItem('multas_biblioteca');
    if (salvo) {
      multas = JSON.parse(salvo);
    } else {
      // Multas de exemplo
      multas = [
        { id: 1, data: "2025-06-15", usuarioId: 1, usuarioNome: "Ana Martins", livroId: 1, livroNome: "O Nome do Vento", motivo: "Atraso de 5 dias", valor: 2.50, status: "pendente" },
        { id: 2, data: "2025-05-20", usuarioId: 3, usuarioNome: "Fernanda Lima", livroId: 4, livroNome: "Duna", motivo: "Atraso de 3 dias", valor: 1.50, status: "pago" },
        { id: 3, data: "2025-06-10", usuarioId: 2, usuarioNome: "Carlos Silva", livroId: 2, livroNome: "Dom Quixote", motivo: "Dano na capa", valor: 8.00, status: "pendente" },
        { id: 4, data: "2025-06-18", usuarioId: 4, usuarioNome: "Roberto Almeida", livroId: 3, livroNome: "1984", motivo: "Extravio do livro", valor: 47.88, status: "pendente" }
      ];
      salvarMultas();
    }
    renderTudo();
  }
  
  function salvarMultas() {
    localStorage.setItem('multas_biblioteca', JSON.stringify(multas));
  }
  
  function renderTudo() {
    renderStats();
    renderMultasTable();
    renderUserDebtGrid();
  }
  
  function renderStats() {
    const pendentes = multas.filter(m => m.status === 'pendente');
    const pagas = multas.filter(m => m.status === 'pago');
    const totalPendente = pendentes.reduce((sum, m) => sum + m.valor, 0);
    
    document.getElementById('totalMultas').textContent = multas.length;
    document.getElementById('totalPendentes').textContent = pendentes.length;
    document.getElementById('totalPagas').textContent = pagas.length;
    document.getElementById('valorTotal').textContent = `R$ ${totalPendente.toFixed(2)}`;
  }
  
  function renderMultasTable() {
    let filtered = [...multas];
    
    if (currentFilter !== 'all') {
      filtered = filtered.filter(m => m.status === currentFilter);
    }
    
    if (currentSearch) {
      filtered = filtered.filter(m => 
        m.usuarioNome.toLowerCase().includes(currentSearch) || 
        m.livroNome.toLowerCase().includes(currentSearch)
      );
    }
    
    const tbody = document.getElementById('multasTableBody');
    tbody.innerHTML = filtered.map(m => `
      <tr>
        <td>${new Date(m.data).toLocaleDateString('pt-BR')}</td>
        <td><strong>${m.usuarioNome}</strong><br><span class="matricula">${obterMatricula(m.usuarioId)}</span></td>
        <td>${m.livroNome}</td>
        <td>${m.motivo}</td>
        <td class="valor">R$ ${m.valor.toFixed(2)}</td>
        <td><span class="status-badge ${m.status === 'pago' ? 'pago' : 'pendente'}">${m.status === 'pago' ? '✅ Pago' : '⏳ Pendente'}</span></td>
        <td>
          ${m.status === 'pendente' ? `<button class="btn-pagar" onclick="marcarComoPago(${m.id})">💰 Marcar pago</button>` : ''}
          <button class="btn-excluir" onclick="abrirModalExcluir(${m.id})">🗑️ Excluir</button>
          </td>
      </tr>
    `).join('');
    
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="no-results">Nenhuma multa encontrada</td></tr>';
    }
  }
  
  function renderUserDebtGrid() {
    const userDebt = new Map();
    multas.forEach(m => {
      if (!userDebt.has(m.usuarioId)) {
        userDebt.set(m.usuarioId, { nome: m.usuarioNome, total: 0, pendente: 0, pago: 0, qtd: 0 });
      }
      const user = userDebt.get(m.usuarioId);
      user.total += m.valor;
      user.qtd++;
      if (m.status === 'pendente') user.pendente += m.valor;
      else user.pago += m.valor;
    });
    
    const container = document.getElementById('userDebtGrid');
    if (userDebt.size === 0) {
      container.innerHTML = '<div class="no-results" style="padding: 40px; text-align: center;">Nenhum usuário com multa registrada</div>';
      return;
    }
    
    container.innerHTML = Array.from(userDebt.values()).map(u => `
      <div class="debt-card">
        <div class="debt-avatar">${u.nome.charAt(0)}</div>
        <div class="debt-info">
          <strong>${u.nome}</strong>
          <span>${u.qtd} multa(s)</span>
        </div>
        <div class="debt-values">
          <span class="total">Total: R$ ${u.total.toFixed(2)}</span>
          ${u.pendente > 0 ? `<span class="pendente">Pendente: R$ ${u.pendente.toFixed(2)}</span>` : '<span class="quitado">✅ Quitado</span>'}
        </div>
        <button class="btn-small" onclick="filtrarPorUsuario('${u.nome}')">Ver multas</button>
      </div>
    `).join('');
  }
  
  function filtrarPorUsuario(nome) {
    document.getElementById('searchMulta').value = nome;
    currentSearch = nome.toLowerCase();
    renderMultasTable();
    showToast(`Filtrando multas de ${nome}`);
  }
  
  function obterMatricula(usuarioId) {
    const user = usuarios.find(u => u.id === usuarioId);
    return user ? user.matricula : '';
  }
  
  function adicionarMulta(event) {
    event.preventDefault();
    
    const usuarioId = parseInt(document.getElementById('multaUsuario').value, 10);
    const livroId = parseInt(document.getElementById('multaLivro').value, 10);
    const tipo = document.getElementById('multaTipo').value;
    const valor = parseFloat(document.getElementById('multaValor').value);
    const data = document.getElementById('multaData').value;
    const motivo = document.getElementById('multaMotivo').value || obterMotivoPorTipo(tipo);
    
    const usuario = usuarios.find(u => u.id === usuarioId);
    const livro = livros.find(l => l.id === livroId);
    
    if (!usuario || !livro || !tipo || Number.isNaN(valor) || valor <= 0 || !data) {
      showToast('Preencha todos os campos obrigatórios corretamente.', 'error');
      return;
    }
    
    const novaMulta = {
      id: Date.now(),
      data: data,
      usuarioId: usuarioId,
      usuarioNome: usuario.nome,
      livroId: livroId,
      livroNome: livro.nome,
      motivo: motivo,
      valor: valor,
      status: "pendente"
    };
    
    multas.push(novaMulta);
    salvarMultas();
    renderTudo();
    
    // Limpar formulário
    document.getElementById('multaUsuario').value = '';
    document.getElementById('multaLivro').value = '';
    document.getElementById('multaTipo').value = '';
    document.getElementById('multaValor').value = '';
    document.getElementById('multaDias').value = '';
    document.getElementById('multaMotivo').value = '';
    
    showToast(`Multa de R$ ${valor.toFixed(2)} adicionada para ${usuario.nome}`);
  }
  
  function obterMotivoPorTipo(tipo) {
    const motivos = {
      atraso: "Atraso na devolução do livro",
      dano: "Dano físico ao livro",
      extravio: "Extravio do livro",
      outro: "Outro motivo"
    };
    return motivos[tipo] || "Motivo não especificado";
  }
  
  function marcarComoPago(id) {
    const multa = multas.find(m => m.id === id);
    if (multa && multa.status === 'pendente') {
      multa.status = 'pago';
      salvarMultas();
      renderTudo();
      showToast(`Multa de R$ ${multa.valor.toFixed(2)} marcada como paga`);
    }
  }
  
  function abrirModalExcluir(id) {
    multaParaExcluir = id;
    const modal = document.getElementById('modalExcluir');
    modal.classList.add('active');
  }
  
  function fecharModalExcluir() {
    const modal = document.getElementById('modalExcluir');
    modal.classList.remove('active');
    multaParaExcluir = null;
  }
  
  function confirmarExcluir() {
    if (multaParaExcluir) {
      const multa = multas.find(m => m.id === multaParaExcluir);
      const multaNome = multa ? `${multa.usuarioNome} - ${multa.livroNome}` : '';
      
      multas = multas.filter(m => m.id !== multaParaExcluir);
      salvarMultas();
      renderTudo();
      fecharModalExcluir();
      showToast(`Multa de ${multaNome} foi excluída com sucesso!`);
    }
  }
  
  function atualizarValorSugerido() {
    const tipo = document.getElementById('multaTipo').value;
    const dias = parseInt(document.getElementById('multaDias').value) || 0;
    const livroId = parseInt(document.getElementById('multaLivro').value);
    const livro = livros.find(l => l.id === livroId);
    
    let valorSugerido = 0;
    if (tipo === 'atraso') {
      valorSugerido = dias * 0.50;
    } else if (tipo === 'dano') {
      valorSugerido = livro ? livro.valor * 0.3 : 10;
    } else if (tipo === 'extravio') {
      valorSugerido = livro ? livro.valor * 1.2 : 50;
    }
    
    if (valorSugerido > 0) {
      document.getElementById('multaValor').value = valorSugerido.toFixed(2);
    }
  }
  
  function calcularMulta() {
    const dias = parseInt(document.getElementById('calcDias').value, 10) || 0;
    const valorDia = parseFloat(document.getElementById('calcValorDia').value) || 0.50;
    const total = dias * valorDia;
    document.getElementById('calcResultado').textContent = `R$ ${total.toFixed(2)}`;
  }
  
  function exportarMultas() {
    let csv = "Data,Usuário,Matrícula,Livro,Motivo,Valor,Status\n";
    multas.forEach(m => {
      const matricula = obterMatricula(m.usuarioId);
      csv += `${m.data},${m.usuarioNome},${matricula},${m.livroNome},${m.motivo},${m.valor},${m.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `multas_biblioteca_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Relatório de multas exportado com sucesso!');
  }
  
  let toastTimeout = null;
  function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (!toast || !toastMsg) return;
    toastMsg.textContent = msg;
    toast.className = `toast show ${type}`;
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.className = 'toast';
      toastTimeout = null;
    }, 3000);
  }
  
  function preencherSelects() {
    const usuarioSelect = document.getElementById('multaUsuario');
    usuarioSelect.innerHTML = '<option value="">Selecione um usuário</option>' + 
      usuarios.map(u => `<option value="${u.id}">${u.nome} (${u.matricula})</option>`).join('');
    
    const livroSelect = document.getElementById('multaLivro');
    livroSelect.innerHTML = '<option value="">Selecione um livro</option>' + 
      livros.map(l => `<option value="${l.id}">${l.nome}</option>`).join('');
    
    document.getElementById('multaData').value = new Date().toISOString().split('T')[0];
  }
  
  function initMultasApp() {
    preencherSelects();
    carregarMultas();

    document.getElementById('multaForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      adicionarMulta(event);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentFilter = this.getAttribute('data-filter');
        renderMultasTable();
      });
    });

    document.getElementById('searchMulta')?.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase();
      renderMultasTable();
    });

    document.getElementById('multaTipo')?.addEventListener('change', atualizarValorSugerido);
    document.getElementById('multaLivro')?.addEventListener('change', atualizarValorSugerido);
    document.getElementById('multaDias')?.addEventListener('input', atualizarValorSugerido);
    document.getElementById('calcDias')?.addEventListener('input', calcularMulta);
    document.getElementById('calcValorDia')?.addEventListener('input', calcularMulta);

    document.getElementById('modalExcluir')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalExcluir')) {
        fecharModalExcluir();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        fecharModalExcluir();
      }
    });
  }

  window.addEventListener('DOMContentLoaded', initMultasApp);
  
  // Expor funções globais
  window.adicionarMulta = adicionarMulta;
  window.marcarComoPago = marcarComoPago;
  window.abrirModalExcluir = abrirModalExcluir;
  window.fecharModalExcluir = fecharModalExcluir;
  window.confirmarExcluir = confirmarExcluir;
  window.atualizarValorSugerido = atualizarValorSugerido;
  window.calcularMulta = calcularMulta;
  window.exportarMultas = exportarMultas;
  window.filtrarPorUsuario = filtrarPorUsuario;
  window.showToast = showToast;