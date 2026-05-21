// ============================================
// SISTEMA BIBLIOTECA ESCOLAR - BIBLIOTECÁRIO
// Gerenciamento completo: acervo, empréstimos, devoluções, usuários, relatórios
// ============================================

// Dados mockados
let biblioteca = {
  livros: [
    { id: 1, titulo: "O Nome do Vento", autor: "Patrick Rothfuss", ano: 2007, genero: "Fantasia", exemplares: 3, disponiveis: 1, isbn: "9788578270698" },
    { id: 2, titulo: "Dom Quixote", autor: "Miguel de Cervantes", ano: 1605, genero: "Clássico", exemplares: 2, disponiveis: 2, isbn: "9788572321234" },
    { id: 3, titulo: "1984", autor: "George Orwell", ano: 1949, genero: "Distopia", exemplares: 4, disponiveis: 2, isbn: "9788535914849" },
    { id: 4, titulo: "Duna", autor: "Frank Herbert", ano: 1965, genero: "Ficção científica", exemplares: 2, disponiveis: 0, isbn: "9788576572321" },
    { id: 5, titulo: "O Pequeno Príncipe", autor: "Saint-Exupéry", ano: 1943, genero: "Fábula", exemplares: 5, disponiveis: 3, isbn: "9788595081512" }
  ],
  usuarios: [
    { id: 1, nome: "Ana", sobrenome: "Martins", email: "ana@escola.edu.br", matricula: "20241023", tipo: "aluno", telefone: "(11) 99999-1111", endereco: "Rua A, 123" },
    { id: 2, nome: "Carlos", sobrenome: "Silva", email: "carlos@escola.edu.br", matricula: "20241045", tipo: "aluno", telefone: "(11) 99999-2222", endereco: "Rua B, 456" },
    { id: 3, nome: "Fernanda", sobrenome: "Lima", email: "fernanda@escola.edu.br", matricula: "20240812", tipo: "aluno", telefone: "(11) 99999-3333", endereco: "Rua C, 789" },
    { id: 4, nome: "Roberto", sobrenome: "Almeida", email: "roberto@professor.com", matricula: "PROF001", tipo: "professor", telefone: "(11) 99999-4444", endereco: "Rua D, 101" }
  ],
  emprestimos: [
    { id: 1, usuarioId: 1, livroId: 1, dataInicio: "2025-06-05", dataFim: "2025-06-20", dataDevolucao: null, status: "active", observacoes: "" },
    { id: 2, usuarioId: 2, livroId: 2, dataInicio: "2025-06-08", dataFim: "2025-06-25", dataDevolucao: null, status: "active", observacoes: "" },
    { id: 3, usuarioId: 3, livroId: 4, dataInicio: "2025-06-01", dataFim: "2025-06-15", dataDevolucao: null, status: "overdue", observacoes: "" }
  ],
  devolucoes: [
    { id: 1, emprestimoId: 1, dataDevolucao: "2025-06-10", multa: 0, observacoes: "Bom estado" }
  ],
  reservas: [
    { id: 1, livroId: 4, usuarioId: 4, dataReserva: "2025-06-10", status: "pending", usuario: { nome: "Roberto Almeida" }, livro: { titulo: "Duna" } },
    { id: 2, livroId: 1, usuarioId: 3, dataReserva: "2025-06-12", status: "available", usuario: { nome: "Fernanda Lima" }, livro: { titulo: "O Nome do Vento" } }
  ],
  atividades: [
    { id: 1, horario: "10:30", descricao: "Empréstimo: '1984' para João Pedro", tipo: "emprestimo" },
    { id: 2, horario: "09:45", descricao: "Devolução: 'O Pequeno Príncipe'", tipo: "devolucao" },
    { id: 3, horario: "09:00", descricao: "Novo usuário cadastrado: Sofia M.", tipo: "cadastro" },
    { id: 4, horario: "08:30", descricao: "Reserva confirmada: 'Duna'", tipo: "reserva" }
  ]
};

let nextLivroId = 6;
let nextUsuarioId = 5;
let nextEmprestimoId = 4;
let nextDevolucaoId = 2;
let nextReservaId = 3;
let nextAtividadeId = 5;

const STORAGE_KEY = 'biblioteca_app_state';
let toastTimeout = null;
let currentLoanFilter = 'all';

function saveBibliotecaState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    biblioteca,
    nextLivroId,
    nextUsuarioId,
    nextEmprestimoId,
    nextDevolucaoId,
    nextReservaId,
    nextAtividadeId
  }));
}

function loadBibliotecaState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    if (state?.biblioteca) {
      biblioteca = state.biblioteca;
      nextLivroId = state.nextLivroId ?? nextLivroId;
      nextUsuarioId = state.nextUsuarioId ?? nextUsuarioId;
      nextEmprestimoId = state.nextEmprestimoId ?? nextEmprestimoId;
      nextDevolucaoId = state.nextDevolucaoId ?? nextDevolucaoId;
      nextReservaId = state.nextReservaId ?? nextReservaId;
      nextAtividadeId = state.nextAtividadeId ?? nextAtividadeId;
    }
  } catch (error) {
    console.warn('Não foi possível carregar estado do localStorage', error);
  }
}

function findUsuarioById(id) {
  return biblioteca.usuarios.find(u => u.id === id) || null;
}

function findLivroById(id) {
  return biblioteca.livros.find(l => l.id === id) || null;
}

function getUsuarioByLoginInput(input) {
  return biblioteca.usuarios.find(u => u.email === input || u.matricula === input) || null;
}

// Dados mensais para gráfico
const dadosMensais = {
  emprestimos: [342, 398, 421, 385, 407, 289, 356, 412, 398, 367, 345, 389],
  devolucoes: [310, 365, 398, 360, 385, 270, 330, 390, 375, 350, 330, 370]
};
const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// Funções auxiliares
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

function addAtividade(descricao, tipo) {
  const agora = new Date();
  const horario = `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;
  biblioteca.atividades.unshift({ id: nextAtividadeId++, horario, descricao, tipo });
  if (biblioteca.atividades.length > 10) biblioteca.atividades.pop();
}

// Navegação
function navigateTo(sectionId) {
  document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');
  document.querySelectorAll('.dashboard-section').forEach(section => section.classList.remove('active'));
  document.getElementById(`section-${sectionId}`).classList.add('active');
  
  if (sectionId === 'acervo') renderAcervo();
  if (sectionId === 'emprestimos') renderEmprestimos();
  if (sectionId === 'devolucoes') { renderActiveLoans(); renderRecentReturns(); }
  if (sectionId === 'usuarios') renderUsuarios();
  if (sectionId === 'dashboard') renderDashboard();
  if (sectionId === 'relatorios') renderRelatorios();
}

// Abrir/fechar formulários
function abrirFormLivro() { document.getElementById('formLivro').classList.remove('hidden'); }
function fecharFormLivro() { document.getElementById('formLivro').classList.add('hidden'); document.getElementById('formLivro').reset(); }
function abrirFormEmprestimo() { 
  document.getElementById('formEmprestimo').classList.remove('hidden');
  carregarLivrosDisponiveis();
  carregarUsuariosLista();
  const hoje = new Date().toISOString().split('T')[0];
  document.getElementById('emprestimoDataInicio').value = hoje;
  const dataFim = new Date();
  dataFim.setDate(dataFim.getDate() + 14);
  document.getElementById('emprestimoDataFim').value = dataFim.toISOString().split('T')[0];
}
function fecharFormEmprestimo() { document.getElementById('formEmprestimo').classList.add('hidden'); document.getElementById('formEmprestimo').reset(); }
function abrirFormDevolucao() { 
  document.getElementById('formDevolucao').classList.remove('hidden');
  document.getElementById('devolucaoData').value = new Date().toISOString().split('T')[0];
  carregarEmprestimosAtivosLista();
}
function fecharFormDevolucao() { document.getElementById('formDevolucao').classList.add('hidden'); document.getElementById('formDevolucao').reset(); }
function abrirFormUsuario() { document.getElementById('formUsuario').classList.remove('hidden'); }
function fecharFormUsuario() { document.getElementById('formUsuario').classList.add('hidden'); document.getElementById('formUsuario').reset(); }

// Cadastrar Livro
function cadastrarLivro(event) {
  event.preventDefault();
  const titulo = document.getElementById('livroTitulo').value.trim();
  const autor = document.getElementById('livroAutor').value.trim();
  const ano = parseInt(document.getElementById('livroAno').value, 10) || 0;
  const genero = document.getElementById('livroGenero').value.trim();
  const exemplares = parseInt(document.getElementById('livroExemplares').value, 10);
  const isbn = document.getElementById('livroIsbn').value.trim();

  if (!titulo || !autor || !genero || Number.isNaN(exemplares) || exemplares <= 0) {
    showToast('Preencha todos os campos obrigatórios do livro.', 'error');
    return;
  }

  const novoLivro = {
    id: nextLivroId++,
    titulo,
    autor,
    ano,
    genero,
    exemplares,
    disponiveis: exemplares,
    isbn
  };
  biblioteca.livros.push(novoLivro);
  saveBibliotecaState();
  renderAcervo();
  fecharFormLivro();
  addAtividade(`Novo livro adicionado: "${titulo}"`, "cadastro");
  showToast(`Livro "${titulo}" adicionado com sucesso!`);
  atualizarDashboardStats();
}

// Cadastrar Usuário
function cadastrarUsuario(event) {
  event.preventDefault();
  const nome = document.getElementById('userNome').value.trim();
  const sobrenome = document.getElementById('userSobrenome').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  const matricula = document.getElementById('userMatricula').value.trim();
  const tipo = document.getElementById('userTipo').value;
  const telefone = document.getElementById('userTelefone').value.trim();

  if (!nome || !sobrenome || !email || !matricula || !tipo) {
    showToast('Preencha todos os campos obrigatórios do usuário.', 'error');
    return;
  }

  const novoUsuario = {
    id: nextUsuarioId++,
    nome,
    sobrenome,
    email,
    matricula,
    tipo,
    telefone,
    endereco: ""
  };
  biblioteca.usuarios.push(novoUsuario);
  saveBibliotecaState();
  renderUsuarios();
  fecharFormUsuario();
  addAtividade(`Novo usuário cadastrado: ${nome} ${sobrenome}`, "cadastro");
  showToast(`Usuário ${nome} cadastrado com sucesso!`);
  atualizarDashboardStats();
}

// Registrar Empréstimo
function registrarEmprestimo(event) {
  event.preventDefault();
  const usuarioInput = document.getElementById('emprestimoUsuario').value.trim();
  const livroId = parseInt(document.getElementById('emprestimoLivro').value, 10);
  const dataInicio = document.getElementById('emprestimoDataInicio').value;
  const dataFim = document.getElementById('emprestimoDataFim').value;

  if (!usuarioInput || Number.isNaN(livroId) || !dataInicio || !dataFim) {
    showToast('Preencha todos os campos do empréstimo.', 'error');
    return;
  }

  const usuario = getUsuarioByLoginInput(usuarioInput);
  if (!usuario) { showToast('Usuário não encontrado!', 'error'); return; }

  const livro = findLivroById(livroId);
  if (!livro || livro.disponiveis <= 0) { showToast('Livro indisponível!', 'error'); return; }

  const novoEmprestimo = {
    id: nextEmprestimoId++,
    usuarioId: usuario.id,
    livroId: livro.id,
    dataInicio: dataInicio,
    dataFim: dataFim,
    dataDevolucao: null,
    status: 'active',
    observacoes: ''
  };
  biblioteca.emprestimos.push(novoEmprestimo);
  livro.disponiveis--;
  saveBibliotecaState();
  renderEmprestimos();
  fecharFormEmprestimo();
  addAtividade(`Empréstimo: "${livro.titulo}" para ${usuario.nome}`, "emprestimo");
  showToast(`Empréstimo registrado para ${usuario.nome}`);
  atualizarDashboardStats();
  renderActiveLoans();
}

// Registrar Devolução
function registrarDevolucao(event) {
  event.preventDefault();
  const busca = document.getElementById('devolucaoBusca').value;
  const dataDevolucao = document.getElementById('devolucaoData').value;
  const multa = parseFloat(document.getElementById('devolucaoMulta').value) || 0;
  
  const emprestimo = biblioteca.emprestimos.find(e => {
    const usuario = biblioteca.usuarios.find(u => u.id === e.usuarioId);
    const livro = biblioteca.livros.find(l => l.id === e.livroId);
    return e.status === 'active' && (usuario?.nome.toLowerCase().includes(busca.toLowerCase()) || 
           usuario?.matricula === busca || livro?.titulo.toLowerCase().includes(busca.toLowerCase()));
  });
  
  if (!emprestimo) { showToast('Empréstimo não encontrado!', 'error'); return; }
  
  const usuario = biblioteca.usuarios.find(u => u.id === emprestimo.usuarioId);
  const livro = biblioteca.livros.find(l => l.id === emprestimo.livroId);
  
  emprestimo.dataDevolucao = dataDevolucao;
  emprestimo.status = 'returned';
  
  if (livro) livro.disponiveis++;
  
  biblioteca.devolucoes.push({
    id: nextDevolucaoId++,
    emprestimoId: emprestimo.id,
    dataDevolucao: dataDevolucao,
    multa: multa,
    observacoes: document.getElementById('devolucaoObs')?.value || ''
  });
  saveBibliotecaState();
  
  renderActiveLoans();
  renderRecentReturns();
  renderEmprestimos();
  fecharFormDevolucao();
  addAtividade(`Devolução: "${livro?.titulo}" de ${usuario?.nome}`, "devolucao");
  showToast(`Devolução registrada com sucesso! ${multa > 0 ? `Multa: R$ ${multa.toFixed(2)}` : ''}`);
  atualizarDashboardStats();
}

// Renderizações
function renderAcervo() {
  const search = document.getElementById('searchAcervo')?.value.toLowerCase() || '';
  const filtered = biblioteca.livros.filter(l => l.titulo.toLowerCase().includes(search) || l.autor.toLowerCase().includes(search));
  const tbody = document.getElementById('bookTableBody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-results">Nenhum livro encontrado</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(l => `
    <tr>
      <td><strong>${l.titulo}</strong></td>
      <td>${l.autor}</td>
      <td>${l.ano || '-'}</td>
      <td>${l.genero || '-'}</td>
      <td>${l.exemplares}</td>
      <td><span class="status-badge ${l.disponiveis > 0 ? 'active' : 'overdue'}">${l.disponiveis}</span></td>
      <td><button class="btn-icon" onclick="showToast('Edição em desenvolvimento')">✏️</button></td>
    </tr>
  `).join('');
}

function renderEmprestimos() {
  const tbody = document.getElementById('loanTableBody');
  if (!tbody) return;

  let emprestimos = biblioteca.emprestimos;
  if (currentLoanFilter !== 'all') {
    emprestimos = emprestimos.filter(e => e.status === currentLoanFilter);
  }

  tbody.innerHTML = emprestimos.map(e => {
    const usuario = findUsuarioById(e.usuarioId);
    const livro = findLivroById(e.livroId);
    const statusClass = e.status === 'active' ? 'active' : (e.status === 'overdue' ? 'overdue' : 'returned');
    const statusText = e.status === 'active' ? 'Ativo' : (e.status === 'overdue' ? 'Atrasado' : 'Devolvido');
    return `<tr><td>${usuario?.nome || '-'}</td><td>${livro?.titulo || '-'}</td><td>${e.dataInicio}</td><td>${e.dataFim}</td><td><span class="status-badge ${statusClass}">${statusText}</span></td><td><button class="btn-icon" onclick="showToast('Detalhes do empréstimo')">🔍</button></td></tr>`;
  }).join('');

  if (emprestimos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="no-results">Nenhum empréstimo encontrado</td></tr>';
  }
}

function setupEmprestimoFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLoanFilter = btn.dataset.filter || 'all';
      renderEmprestimos();
    });
  });
}

function renderUsuarios() {
  const search = document.getElementById('searchUsuario')?.value.toLowerCase() || '';
  const filtered = biblioteca.usuarios.filter(u => u.nome.toLowerCase().includes(search) || u.matricula.includes(search) || u.email.toLowerCase().includes(search));
  const grid = document.getElementById('usersGrid');
  if (!grid) return;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-results">Nenhum usuário encontrado</div>';
    return;
  }

  grid.innerHTML = filtered.map(u => `
    <div class="user-card">
      <div class="user-avatar-card">${u.nome.charAt(0)}${u.sobrenome.charAt(0)}</div>
      <div class="user-info-card">
        <h4>${u.nome} ${u.sobrenome}</h4>
        <p>${u.email}</p>
        <p>Matrícula: ${u.matricula}</p>
        <span class="badge-tipo">${u.tipo === 'aluno' ? 'Aluno' : u.tipo === 'professor' ? 'Professor' : u.tipo === 'bibliotecario' ? 'Bibliotecário' : 'Visitante'}</span>
      </div>
    </div>
  `).join('');
}

function renderActiveLoans() {
  const active = biblioteca.emprestimos.filter(e => e.status === 'active' || e.status === 'overdue');
  const grid = document.getElementById('activeLoansGrid');
  if (!grid) return;
  grid.innerHTML = active.map(e => {
    const usuario = biblioteca.usuarios.find(u => u.id === e.usuarioId);
    const livro = biblioteca.livros.find(l => l.id === e.livroId);
    return `<div class="loan-card"><div class="loan-card-info"><strong>${livro?.titulo}</strong><span>${usuario?.nome}</span><span>Vence: ${e.dataFim}</span></div><button class="btn-devolver" onclick="preencherDevolucao('${usuario?.nome}')">Devolver</button></div>`;
  }).join('');
}

function preencherDevolucao(nome) {
  document.getElementById('devolucaoBusca').value = nome;
  abrirFormDevolucao();
}

function renderRecentReturns() {
  const recent = biblioteca.devolucoes.slice(-5).reverse();
  const container = document.getElementById('recentReturns');
  if (!container) return;
  container.innerHTML = recent.map(d => {
    const emprestimo = biblioteca.emprestimos.find(e => e.id === d.emprestimoId);
    const usuario = emprestimo ? biblioteca.usuarios.find(u => u.id === emprestimo.usuarioId) : null;
    const livro = emprestimo ? biblioteca.livros.find(l => l.id === emprestimo.livroId) : null;
    return `<div class="return-item"><span><strong>${livro?.titulo}</strong> - ${usuario?.nome}</span><span>${d.dataDevolucao}</span>${d.multa > 0 ? `<span class="status-badge overdue">Multa: R$ ${d.multa.toFixed(2)}</span>` : '<span class="status-badge active">OK</span>'}</div>`;
  }).join('');
}

function renderDashboard() {
  document.getElementById('totalLivros').textContent = biblioteca.livros.length;
  document.getElementById('totalUsuarios').textContent = biblioteca.usuarios.length;
  document.getElementById('totalEmprestimos').textContent = biblioteca.emprestimos.filter(e => e.status === 'active').length;
  document.getElementById('totalAtrasos').textContent = biblioteca.emprestimos.filter(e => e.status === 'overdue').length;
  document.getElementById('vencimentosCount').textContent = biblioteca.emprestimos.filter(e => e.status === 'active').length;
  
  const pendingList = document.getElementById('pendingList');
  if (pendingList) {
    pendingList.innerHTML = biblioteca.emprestimos.filter(e => e.status === 'active' || e.status === 'overdue').slice(0, 3).map(e => {
      const usuario = biblioteca.usuarios.find(u => u.id === e.usuarioId);
      const livro = biblioteca.livros.find(l => l.id === e.livroId);
      const hoje = new Date();
      const vencimento = new Date(e.dataFim);
      const diasRestantes = Math.ceil((vencimento - hoje) / (1000 * 60 * 60 * 24));
      const statusClass = diasRestantes < 0 ? 'warning' : 'neutral';
      const statusText = diasRestantes < 0 ? 'Atrasado' : `${diasRestantes} dias restantes`;
      return `<div class="pending-item"><div class="pending-info"><strong>${livro?.titulo}</strong><span>${usuario?.nome}</span></div><div class="pending-date ${statusClass}">${statusText}</div></div>`;
    }).join('');
  }
  
  const activityList = document.getElementById('activityList');
  if (activityList) {
    activityList.innerHTML = biblioteca.atividades.slice(0, 4).map(a => `
      <div class="activity-item"><span class="activity-time">${a.horario}</span><span>${a.descricao}</span></div>
    `).join('');
  }
  
  const reservasList = document.getElementById('reservasList');
  if (reservasList) {
    reservasList.innerHTML = biblioteca.reservas.map(r => `
      <div class="reserva-row"><span><strong>${r.livro.titulo}</strong> - ${r.usuario.nome}</span><span class="reserva-status">${r.status === 'pending' ? 'Aguardando' : 'Disponível'}</span><button class="btn-small" onclick="showToast('Notificação enviada')">Notificar</button></div>
    `).join('');
  }
}

function renderRelatorios() {
  // Empréstimos mensais
  const totalEmprestimos = dadosMensais.emprestimos.reduce((a, b) => a + b, 0);
  document.getElementById('relEmprestimosMensal').innerHTML = `Total anual: ${totalEmprestimos}<br>Média mensal: ${Math.round(totalEmprestimos / 12)}`;
  
  // Taxa de devolução
  const totalDevolucoes = dadosMensais.devolucoes.reduce((a, b) => a + b, 0);
  const taxa = totalEmprestimos ? ((totalDevolucoes / totalEmprestimos) * 100).toFixed(1) : '0.0';
  document.getElementById('relTaxaDevolucao').innerHTML = `Total devoluções: ${totalDevolucoes}<br>Taxa: ${taxa}%`;
  
  // Livros mais populares
  const contagemLivros = {};
  biblioteca.emprestimos.forEach(e => {
    const livro = biblioteca.livros.find(l => l.id === e.livroId);
    if (livro) contagemLivros[livro.titulo] = (contagemLivros[livro.titulo] || 0) + 1;
  });
  const topLivros = Object.entries(contagemLivros).sort((a, b) => b[1] - a[1]).slice(0, 3);
  document.getElementById('relLivrosPopulares').innerHTML = topLivros.map(([titulo, qtd]) => `${titulo} (${qtd}x)`).join('<br>') || 'Nenhum dado';
  
  // Usuários por tipo
  const alunos = biblioteca.usuarios.filter(u => u.tipo === 'aluno').length;
  const professores = biblioteca.usuarios.filter(u => u.tipo === 'professor').length;
  const visitantes = biblioteca.usuarios.filter(u => u.tipo === 'visitante').length;
  document.getElementById('relUsuariosPorTipo').innerHTML = `Alunos: ${alunos}<br>Professores: ${professores}<br>Visitantes: ${visitantes}`;
  
  // Gráfico de barras
  const chartBars = document.getElementById('chartBars');
  if (chartBars) {
    chartBars.innerHTML = dadosMensais.emprestimos.slice(0, 6).map((valor, i) => `
      <div class="bar-item"><span>${meses[i]}</span><div class="bar" style="height: ${Math.min(valor / 5, 80)}px;"></div><span>${valor}</span></div>
    `).join('');
  }
}

function carregarLivrosDisponiveis() {
  const select = document.getElementById('emprestimoLivro');
  const disponiveis = biblioteca.livros.filter(l => l.disponiveis > 0);
  select.innerHTML = '<option value="">Selecione um livro disponível</option>' + disponiveis.map(l => `<option value="${l.id}">${l.titulo} (${l.disponiveis} disp.)</option>`).join('');
}

function carregarUsuariosLista() {
  const datalist = document.getElementById('usuariosList');
  datalist.innerHTML = biblioteca.usuarios.map(u => `<option value="${u.email}">${u.nome} ${u.sobrenome} - ${u.matricula}</option>`).join('');
}

function carregarEmprestimosAtivosLista() {
  const datalist = document.getElementById('emprestimosAtivosList');
  const ativos = biblioteca.emprestimos.filter(e => e.status === 'active' || e.status === 'overdue');
  datalist.innerHTML = ativos.map(e => {
    const usuario = biblioteca.usuarios.find(u => u.id === e.usuarioId);
    const livro = biblioteca.livros.find(l => l.id === e.livroId);
    return `<option value="${usuario?.nome} - ${livro?.titulo}">`;
  }).join('');
}

function atualizarDashboardStats() {
  if (document.getElementById('section-dashboard').classList.contains('active')) renderDashboard();
}

function gerarRelatorio(tipo) {
  showToast(`Relatório de ${tipo} gerado com sucesso!`);
}

function exportarRelatorio(formato) {
  showToast(`Relatório exportado em ${formato}. Download iniciado.`);
}

// Event Listeners e inicialização
window.addEventListener('DOMContentLoaded', () => {
  loadBibliotecaState();
  renderAcervo();
  renderEmprestimos();
  renderUsuarios();
  renderActiveLoans();
  renderRecentReturns();
  renderDashboard();
  renderRelatorios();
  setupEmprestimoFilters();
  
  document.getElementById('searchAcervo')?.addEventListener('input', () => renderAcervo());
  document.getElementById('searchUsuario')?.addEventListener('input', () => renderUsuarios());
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    showToast('Sessão encerrada. Até logo!');
    setTimeout(() => alert('Redirecionando para tela de login...'), 1000);
  });
});

// Expor funções globais
window.navigateTo = navigateTo;
window.abrirFormLivro = abrirFormLivro;
window.fecharFormLivro = fecharFormLivro;
window.abrirFormEmprestimo = abrirFormEmprestimo;
window.fecharFormEmprestimo = fecharFormEmprestimo;
window.abrirFormDevolucao = abrirFormDevolucao;
window.fecharFormDevolucao = fecharFormDevolucao;
window.abrirFormUsuario = abrirFormUsuario;
window.fecharFormUsuario = fecharFormUsuario;
window.cadastrarLivro = cadastrarLivro;
window.cadastrarUsuario = cadastrarUsuario;
window.registrarEmprestimo = registrarEmprestimo;
window.registrarDevolucao = registrarDevolucao;
window.preencherDevolucao = preencherDevolucao;
window.gerarRelatorio = gerarRelatorio;
window.exportarRelatorio = exportarRelatorio;
window.showToast = showToast;