// Conteúdos de exemplo usados nos testes e nas demos da landing page.
export const deck = {
  title: 'IA na sala de aula',
  theme: 'academia',
  lang: 'pt-BR',
  slides: [
    { layout: 'title', kicker: 'Formação docente · 2026', title: 'IA na sala de aula: {do medo ao método}', subtitle: 'Como transformar a inteligência artificial em aliada do professor, sem terceirizar o pensamento do aluno.', author: 'Plugin Mythos', date: 'Outubro de 2026', notes: 'Abra com uma pergunta: quem aqui já usou IA para preparar uma aula?' },
    { layout: 'agenda', title: 'O que vamos ver', items: ['Por que a IA já está na sua sala', 'O que muda na avaliação', 'Um método em 4 passos', 'Prática guiada', 'Combinados com a turma'], notes: 'Apresente o roteiro em 30 segundos.' },
    { layout: 'statement', kicker: 'A ideia central', title: 'A IA não substitui o professor: {substitui a aula que só transmite}.', notes: 'Pausa de 3 segundos depois desta frase.' },
    { layout: 'stats', title: 'Os alunos já chegaram lá', stats: [{ value: '78%', label: 'dos estudantes usam IA', detail: 'exemplo ilustrativo' }, { value: '3 em 10', label: 'professores se sentem preparados', detail: 'exemplo ilustrativo' }, { value: '2,5 h', label: 'economizadas por semana', detail: 'meta do método' }], notes: 'Deixe claro que os números deste exemplo são ilustrativos.' },
    { layout: 'chart', title: 'Uso de IA cresce a cada semestre', chart: { type: 'line', labels: ['2024.1', '2024.2', '2025.1', '2025.2', '2026.1'], series: [{ name: 'Uso declarado (%)', values: [22, 35, 51, 64, 78] }], suffix: '%' }, text: 'Dados ilustrativos para demonstrar o layout de gráfico.', notes: 'Comente a inclinação da curva.' },
    { layout: 'steps', title: 'Método em 4 passos', items: [{ title: 'Pergunte', text: 'O aluno formula a dúvida antes da IA.', icon: 'message' }, { title: 'Confronte', text: 'Compare a resposta com uma fonte confiável.', icon: 'search' }, { title: 'Reescreva', text: 'Produza com a própria voz.', icon: 'pen' }, { title: 'Reflita', text: 'Registre o que aprendeu e o que a IA errou.', icon: 'lightbulb' }], notes: 'Cada passo tem uma evidência de aprendizagem.' },
    { layout: 'cards', title: 'Termos-chave', flip: true, cards: [{ icon: 'sparkles', title: 'Alucinação', back: 'Quando a IA afirma algo falso com confiança.' }, { icon: 'target', title: 'Prompt', back: 'A instrução que orienta a resposta da IA.' }, { icon: 'shield', title: 'Autoria', back: 'O que é do aluno precisa ser rastreável.' }], notes: 'Peça para a turma adivinhar antes de virar cada carta.' },
    { layout: 'comparison', title: 'Avaliação: antes e depois', left: { heading: 'Antes', icon: 'x', bullets: ['Produto final', 'Texto em casa', 'Correção solitária'] }, right: { heading: 'Depois', icon: 'check', bullets: ['Processo visível', 'Escrita em sala', 'Feedback com rubrica'] }, notes: 'Destaque a mudança de produto para processo.' },
    { layout: 'quiz', question: 'Qual atitude reduz o risco de alucinação?', options: ['Pedir respostas mais longas', 'Conferir em fonte confiável', 'Usar outro idioma', 'Repetir a pergunta'], answer: 1, explanation: 'Checar fontes é a defesa mais eficaz.', notes: 'Deixe a turma votar antes de clicar.' },
    { layout: 'closing', title: 'Próximo passo: {uma aula esta semana}', subtitle: 'Escolha uma atividade e aplique o método em 4 passos.', cta: { label: 'Baixar roteiro', url: 'https://example.com' }, contact: ['contato@exemplo.com'], notes: 'Encerre pedindo um compromisso concreto.' }
  ]
};

export const site = {
  title: 'Aula Pronta',
  theme: 'aurora',
  lang: 'pt-BR',
  nav: { brand: 'Aula Pronta', icon: 'graduation', cta: { label: 'Começar', url: '#precos' } },
  sections: [
    { type: 'hero', badge: 'Novo · 2026', title: 'Planeje uma semana de aulas em {20 minutos}', subtitle: 'Planos, slides e atividades alinhados à BNCC, gerados com IA e revisados por você.', primaryCta: { label: 'Testar grátis', url: '#precos' }, secondaryCta: { label: 'Ver como funciona', url: '#como' }, note: 'Exemplo de landing page gerada pelo Plugin Mythos.' },
    { type: 'logos', title: 'Usado em escolas de exemplo', items: ['Escola Aurora', 'Colégio Delta', 'Instituto Saber', 'Rede Horizonte'] },
    { type: 'features', id: 'recursos', navLabel: 'Recursos', title: 'Tudo o que a sua semana precisa', items: [{ icon: 'book', title: 'Planos de aula', text: 'Objetivos, etapas e avaliação prontos para editar.' }, { icon: 'layers', title: 'Slides', text: 'Apresentações com o seu estilo.' }, { icon: 'target', title: 'Atividades', text: 'Exercícios com gabarito comentado.' }] },
    { type: 'split', id: 'como', navLabel: 'Como funciona', title: 'Você decide, a IA executa', text: 'Escolha a turma, o tema e o tempo disponível.', bullets: ['Alinhado à BNCC', 'Revisão em um clique', 'Exporta para PDF'], chart: { type: 'bar', labels: ['Antes', 'Depois'], series: [{ name: 'Horas de planejamento por semana', values: [6, 1.5] }], suffix: ' h' } },
    { type: 'stats', stats: [{ value: '1.200', label: 'professores (exemplo)' }, { value: '35.000', label: 'aulas geradas (exemplo)' }, { value: '4,8', label: 'nota média (exemplo)' }] },
    { type: 'pricing', id: 'precos', navLabel: 'Preços', title: 'Planos simples', plans: [{ name: 'Grátis', price: 'R$ 0', period: '/mês', features: ['5 aulas por mês', 'Slides básicos'], cta: 'Começar' }, { name: 'Professor', price: 'R$ 29', period: '/mês', features: ['Aulas ilimitadas', 'Todos os temas', 'Exportação PDF'], cta: 'Assinar', highlighted: true }] },
    { type: 'faq', id: 'faq', navLabel: 'FAQ', title: 'Perguntas frequentes', items: [{ q: 'Preciso saber usar IA?', a: 'Não. Você só escolhe tema e turma.' }, { q: 'Posso editar tudo?', a: 'Sim, todo conteúdo é editável.' }] },
    { type: 'cta', title: 'Recupere suas noites de domingo', text: 'Comece agora, sem cartão.', button: { label: 'Criar minha primeira aula', url: '#precos' } }
  ]
};

export const html = {
  title: 'Quiz relâmpago',
  purpose: 'interactive',
  html: '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Quiz</title><style>body{font-family:system-ui;background:#0f172a;color:#e2e8f0;display:grid;place-items:center;min-height:100vh;margin:0}button{font:inherit;padding:12px 18px;margin:6px;border-radius:10px;border:0;background:#6366f1;color:#fff;cursor:pointer}</style></head><body><main><h1 id="q">2 + 2 = ?</h1><div><button data-v="3">3</button><button data-v="4">4</button></div><p id="r" aria-live="polite"></p></main><script>document.querySelectorAll("button").forEach(function(b){b.onclick=function(){document.getElementById("r").textContent=b.dataset.v==="4"?"Correto!":"Tente de novo."}})</script></body></html>'
};
