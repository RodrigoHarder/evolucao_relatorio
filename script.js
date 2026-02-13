const API_URL = "https://backend-api-rz1l.onrender.com/api"
let dados = [];

const loading = document.getElementById("loading");
const terapeutaSelect = document.getElementById("terapeuta");
const pacienteSelect = document.getElementById("paciente");
const tipoAssinaturaSelect = document.getElementById("tipoAssinatura");

async function carregarDados() {
  try {
    loading.style.display = "block";

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro na API");

    dados = await response.json();

    if (!Array.isArray(dados)) return;

    document.getElementById("nomeClinica").innerText =
      dados[0]?.NomeClinica || "Clínica";

    popularTerapeutas();

  } catch (error) {
    alert("Erro ao carregar dados.");
    console.error(error);
  } finally {
    loading.style.display = "none";
  }
}

function popularTerapeutas() {
  const terapeutas = [...new Set(dados.map(d => d.NomeTerapeuta))];

  terapeutaSelect.innerHTML =
    '<option value="">Selecione o terapeuta</option>';

  terapeutas.forEach(t => terapeutaSelect.add(new Option(t, t)));
}

function popularPacientes(terapeuta) {
  const pacientes = [...new Set(
    dados.filter(d => d.NomeTerapeuta === terapeuta)
         .map(d => d.NomePaciente)
  )];

  pacienteSelect.innerHTML =
    '<option value="">Selecione o paciente</option>';

  pacientes.forEach(p => pacienteSelect.add(new Option(p, p)));
}

function formatarDataISO(dataStr) {
  if (!dataStr) return "";
  return new Date(dataStr).toLocaleDateString("pt-BR");
}

function consultar() {

  const terapeuta = terapeutaSelect.value;
  const paciente = pacienteSelect.value;
  const inicio = document.getElementById("dataInicio").value;
  const fim = document.getElementById("dataFim").value;
  const tipoAssinatura = tipoAssinaturaSelect.value;

  if (!terapeuta || !paciente) {
    alert("Selecione terapeuta e paciente.");
    return;
  }

  const filtrado = dados.filter(d => {
    const data = d.DataAtendimento?.split("T")[0];
    return (
      d.NomeTerapeuta === terapeuta &&
      d.NomePaciente === paciente &&
      (!inicio || data >= inicio) &&
      (!fim || data <= fim)
    );
  });

  if (!filtrado.length) {
    alert("Nenhum atendimento encontrado.");
    return;
  }

  document.getElementById("areaRelatorio").style.display = "block";

  document.getElementById("infoPaciente").innerText = paciente;
  document.getElementById("infoNascimento").innerText =
    formatarDataISO(filtrado[0].DataNascimento);
  document.getElementById("infoDiagnostico").innerText =
    filtrado[0].Diagnostico || "";
  document.getElementById("infoResponsavel1").innerText =
    filtrado[0].Responsavel1 || "";
  document.getElementById("infoResponsavel2").innerText =
    filtrado[0].Responsavel2 || "";
  document.getElementById("infoTerapeuta").innerText = terapeuta;
  document.getElementById("infoSetor").innerText =
    filtrado[0].NomeEspecialidade || "";

  const tbody = document.getElementById("tabelaBody");
  const thAssinatura = document.getElementById("colunaAssinatura");
  const assinaturaDoc = document.getElementById("assinaturaDocumento");
  const nomeResponsavel = document.getElementById("nomeResponsavel");

  tbody.innerHTML = "";

  if (tipoAssinatura === "individual") {
    thAssinatura.style.display = "";
    assinaturaDoc.style.display = "none";
  } else {
    thAssinatura.style.display = "none";
    assinaturaDoc.style.display = "block";
    nomeResponsavel.innerText = terapeuta;
  }

  filtrado.forEach(item => {
    const tr = document.createElement("tr");

    if (tipoAssinatura === "individual") {
      tr.innerHTML = `
        <td>${formatarDataISO(item.DataAtendimento)}</td>
        <td>${item.EvolucaoTexto || ""}</td>
        <td class="assinatura"></td>
      `;
    } else {
      tr.innerHTML = `
        <td>${formatarDataISO(item.DataAtendimento)}</td>
        <td>${item.EvolucaoTexto || ""}</td>
      `;
    }

    tbody.appendChild(tr);
  });
}

function baixarPDF() {

  const element = document.getElementById("areaRelatorio");
  const paciente = document.getElementById("infoPaciente").innerText;

  if (!paciente) {
    alert("Gere o relatório antes de baixar.");
    return;
  }

  const hoje = new Date();
  const dataFormatada =
    String(hoje.getDate()).padStart(2, "0") + "-" +
    String(hoje.getMonth() + 1).padStart(2, "0") + "-" +
    hoje.getFullYear();

  const nomeSeguro = paciente
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "");

  const nomeArquivo =
    `Relatorio_Evolucao_${nomeSeguro}_${dataFormatada}.pdf`;

  html2pdf().set({
    margin: 10,
    filename: nomeArquivo,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4" }
  }).from(element).save();
}

terapeutaSelect.addEventListener("change", e =>
  popularPacientes(e.target.value)
);

document.getElementById("consultar")
  .addEventListener("click", consultar);

document.getElementById("baixarPdf")
  .addEventListener("click", baixarPDF);

carregarDados();
