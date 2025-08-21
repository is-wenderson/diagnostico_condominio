document.addEventListener('DOMContentLoaded', () => {
    // A inicialização da aplicação agora começa aqui
    iniciarAplicacao();
});

async function iniciarAplicacao() {
    try {
        // Carrega os textos do arquivo JSON
        const response = await fetch('diagnosticos.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const textos = await response.json();

        // Passa os textos carregados para a função principal que configura os eventos
        configurarDiagnostico(textos);

    } catch (error) {
        console.error("Não foi possível carregar os textos do diagnóstico:", error);
        alert("Erro ao carregar dados essenciais da aplicação. Por favor, recarregue a página.");
    }
}

function configurarDiagnostico(textos) {
    // Seletores de elementos
    const form = document.getElementById('formulario');
    const divDiagnostico = document.getElementById('diagnostico');
    const gerarBtn = document.getElementById('gerar-btn');
    const pdfBtn = document.getElementById('pdf-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const leadForm = document.getElementById('lead-form');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    const whatsappInput = document.getElementById('whatsapp');

    let diagnosticoAtual = null;
    let respostasSalvas = {};
    let dadosDoLead = null;

    function removerEmojis(texto) {
        if (!texto) return "";
        const regex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Component})/gu;
        return texto.replace(regex, '').trim();
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const resp1 = form.querySelector('input[name="pergunta1"]:checked')?.value;
        const resp2 = form.querySelector('input[name="pergunta2"]:checked')?.value;
        const resp3 = form.querySelector('input[name="pergunta3"]:checked')?.value;

        if (!resp1 || !resp2 || !resp3) {
            alert("Por favor, responda a todas as perguntas para gerar o diagnóstico.");
            return;
        }

        respostasSalvas = { resp1, resp2, resp3 };
        modalOverlay.classList.add('visivel');
    });

    leadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const urlDoScript = "https://script.google.com/macros/s/AKfycbx_0MSC0b_sE7bWnW2qmV6VlzTzwYEEeeB2s32HvdS0OXZpgpfAFAibF4B0RBwnmYtP/exec";
        const submitButton = e.target.querySelector('button[type="submit"]');
        const formData = new FormData(leadForm);

        dadosDoLead = {
            nome: formData.get('nome'),
            empresa: formData.get('empresa'),
            email: formData.get('email'),
            whatsapp: formData.get('whatsapp'),
        };

        const { resp1, resp2, resp3 } = respostasSalvas;
        diagnosticoAtual = textos.diagnosticos[resp1][resp2][resp3];
        
            const statusDiagnostico = removerEmojis(diagnosticoAtual.geral).replace('Estrutura', '').trim();
            const stringRespostas = `${resp1}${resp2}${resp3}`;

            formData.append('status_geral', statusDiagnostico);
            formData.append('respostas', stringRespostas);

            submitButton.disabled = true;
            submitButton.textContent = "Salvando...";

            fetch(urlDoScript, {
                method: 'POST',
                body: formData,
            })
        .then(response => response.json())
        .then(data => {
            if (data.result === 'success') {
                console.log("Dados e diagnóstico salvos na planilha com sucesso!");
            } else {
                console.error("Erro ao salvar na planilha:", data.error);
            }
        })
        .catch(error => {
            console.error('Erro no envio do formulário:', error);
        })
        .finally(() => {
            submitButton.disabled = false;
            submitButton.textContent = "Ver meu Diagnóstico Agora";
            fecharModal();
            
            const refRecomendacao = diagnosticoAtual.refRecomendacao;
            const recomendacaoHTML = textos.recomendacoes[refRecomendacao];

            const resultadoHTML = `<h2>Diagnóstico Personalizado</h2><div id="diagnostico-geral" class="${getClasseEstilo(diagnosticoAtual.geral)}">${diagnosticoAtual.geral}</div><div class="pilar-resultado"><h3>Pilar 1: Monitoramento</h3><p>${diagnosticoAtual.pilar1}</p></div><div class="pilar-resultado"><h3>Pilar 2: Controle de Acesso</h3><p>${diagnosticoAtual.pilar2}</p></div><div class="pilar-resultado"><h3>Pilar 3: Segurança Perimetral</h3><p>${diagnosticoAtual.pilar3}</p></div><div id="recomendacao-final">${recomendacaoHTML}</div>`;
            divDiagnostico.innerHTML = resultadoHTML;
            divDiagnostico.style.display = "block";
            gerarBtn.style.display = 'none';
            pdfBtn.style.display = 'inline-block';
            divDiagnostico.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    function fecharModal() {
        modalOverlay.classList.remove('visivel');
    }
    modalCloseBtn.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            fecharModal();
        }
    });

    whatsappInput.addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        valor = valor.substring(0, 11);
        let formatado = '';
        if (valor.length > 0) { formatado = '(' + valor.substring(0, 2); }
        if (valor.length > 2) { formatado += ') ' + valor.substring(2, 7); }
        if (valor.length > 7) { formatado += '-' + valor.substring(7, 11); }
        e.target.value = formatado;
    });

    pdfBtn.addEventListener('click', function() {
        if (diagnosticoAtual && dadosDoLead) {
            const refRecomendacao = diagnosticoAtual.refRecomendacao;
            const recomendacaoHTML = textos.recomendacoes[refRecomendacao];
            gerarEBaixarPDF(diagnosticoAtual, recomendacaoHTML, dadosDoLead);
        } else {
            alert("Por favor, gere um diagnóstico primeiro para depois salvar em PDF.");
        }
    });

function gerarEBaixarPDF(diagnostico, recomendacaoHTML, leadData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    if (headerBase64) {
        const img = new Image();
        img.src = headerBase64;
        img.onload = () => {
            const aspectRatio = img.height / img.width;
            const imgWidth = pageWidth;
            const imgHeight = imgWidth * aspectRatio;
            doc.addImage(headerBase64, 'PNG', 0, 0, imgWidth, imgHeight);
            const yStart = imgHeight + 10;
            continuarGeracao(doc, yStart, pageWidth, pageHeight, margin, diagnostico, recomendacaoHTML, leadData);
        };
    } else {
        const yStart = margin;
        continuarGeracao(doc, yStart, pageWidth, pageHeight, margin, diagnostico, recomendacaoHTML, leadData);
    }
}

function continuarGeracao(doc, yStart, pageWidth, pageHeight, margin, diagnostico, recomendacaoHTML, leadData) {
    let y = yStart;
    const maxWidth = pageWidth - margin * 2;
    const lineHeight = 6;

    const statusGeralLimpo = removerEmojis(diagnostico.geral).trim();
    const statusLower = statusGeralLimpo;

    let bgColor = [230, 240, 255]; // padrão azul claro
    let borderColor = [30, 58, 138]; // padrão azul escuro
    let textColor = [30, 58, 138];

    if (statusLower.includes("Estrutura Crítica")) {
        bgColor = [254, 226, 226];      // vermelho claro
        borderColor = [153, 27, 27];    // vermelho escuro
        textColor = [153, 27, 27];
    } else if (statusLower.includes("Estrutura Intermediária")) {
        bgColor = [254, 249, 195];      // amarelo claro
        borderColor = [146, 64, 14];    // amarelo escuro
        textColor = [146, 64, 14];
    } else if (statusLower.includes("Estrutura Saudável")) {
        bgColor = [209, 250, 229];      // verde claro
        borderColor = [6, 95, 70];      // verde escuro
        textColor = [6, 95, 70];
    }

    const addFooter = () => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128);
        doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
        doc.text("Relatório gerado pela Segcomp, uma empresa do Grupo Ecomp.", margin, pageHeight - 10);
        doc.text(`Página 1 de 1`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    // Título principal
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#1e3a8a");
    doc.text("Diagnóstico de Segurança", pageWidth / 2, y, { align: 'center' });
    y += 10;

    // Empresa
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60);
    doc.text(`Relatório para: ${leadData.empresa}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Caixa de diagnóstico geral com cor dinâmica
    doc.setFillColor(...bgColor);
    doc.setDrawColor(...borderColor);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 12, 3, 3, 'FD');
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...textColor);
    doc.text(statusGeralLimpo, pageWidth / 2, y + 8, { align: 'center' });
    y += 20;

    const adicionarSecaoSimples = (titulo, texto) => {
        const textoLimpo = removerEmojis(texto).trim();
        const linhas = doc.splitTextToSize(textoLimpo, maxWidth);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor("#1e3a8a");
        doc.text(titulo, margin, y);
        y += lineHeight * 1.5;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor("#333");
        doc.text(linhas, margin, y);
        y += (linhas.length * lineHeight) + lineHeight;
    };

    // PILARES
    adicionarSecaoSimples("Pilar 1: Monitoramento de Equipamentos", diagnostico.pilar1);
    adicionarSecaoSimples("Pilar 2: Conectividade / Internet", diagnostico.pilar2);
    adicionarSecaoSimples("Pilar 3: Manutenção Preventiva", diagnostico.pilar3);

    // RECOMENDAÇÃO FINAL
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = recomendacaoHTML;

    tempDiv.childNodes.forEach(node => {
        const textoOriginal = node.innerText;
        if (!textoOriginal || textoOriginal.trim() === "" || node.tagName === 'A') return;
        const textoLimpo = removerEmojis(textoOriginal).trim();
        const linhas = doc.splitTextToSize(textoLimpo, maxWidth);

        if (node.tagName === 'H3') {
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor("#1e3a8a");
            doc.text(linhas, margin, y);
            y += (linhas.length * lineHeight) + (lineHeight / 2);
        }

        if (node.tagName === 'P') {
            doc.setFontSize(11);
            doc.setFont("helvetica", node.classList.contains('fechamento') ? "italic" : "normal");
            doc.setTextColor("#333");
            doc.text(linhas, margin, y);
            y += (linhas.length * lineHeight) + lineHeight;
        }

        if (node.tagName === 'UL') {
            y += lineHeight / 2;
            Array.from(node.children).forEach(liNode => {
                const textoDoItem = removerEmojis(liNode.innerText).trim();
                if (!textoDoItem) return;
                const linhas = doc.splitTextToSize(textoDoItem, maxWidth - 5);
                doc.setFontSize(11);
                doc.setFont("helvetica", "normal");
                doc.setTextColor("#333");
                doc.text("•", margin, y);
                doc.text(linhas, margin + 5, y);
                y += (linhas.length * lineHeight) + (lineHeight / 2);
            });
            y += lineHeight;
        }
    });

    addFooter();
    const nomeArquivo = `Diagnostico_TI_${leadData.empresa.replace(/\s/g, '_')}.pdf`;
    doc.save(nomeArquivo);
}




    function getClasseEstilo(textoGeral) {
        if (textoGeral.includes("Crítica")) return 'critico';
        if (textoGeral.includes("Intermediária")) return 'intermediario';
        if (textoGeral.includes("Saudável")) return 'saudavel';
        return '';
    }
}
