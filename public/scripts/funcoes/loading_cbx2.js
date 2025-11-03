
function preencherCbxCliente(form) {
  const cbx = form.find('#selectCliente');
  cbx.empty(); // Limpa antes de preencher
  $.ajax({
    url: '/listar_cbxCliente',
    type: 'POST',
    success: function (data) {
      const inicio = '<option value="" disabled selected hidden>Selecione a Empresa...</option>';
      cbx.append(inicio);
      data.forEach(os => {
        const linha = `
                        <option value="${os.id_empresas}">${os.nome}</option>
                        `;
        cbx.append(linha);
      });
    },
    error: function (xhr) {
      alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da tabela');
    }
  });
}



//Prenche combobox Supervisor
function preencherCbxSupervisor(idEmpresas, form) {
  const cbx = form.find('#selectSupervisor');
  cbx.empty(); // Limpa antes de preencher

  $.ajax({
    url: '/listar_cbxSupervisor',
    type: 'POST',
    dataType: 'json',
    data: { id_empresas: idEmpresas },
    success: function (data) {
      cbx.append('<option value="" disabled selected hidden>Selecione o Supervisor...</option>');

      data.forEach(os => {
        const linha = `<option value="${os.id_supervisor}">${os.nome} - ${os.empresa}</option>`;
        cbx.append(linha);
      });

      if (data.length === 1) {
        cbx.val(data[0].id_supervisor).trigger('change');
      }
    },
    error: function (xhr) {
      alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento cbx supervisor');
    }
  });
}


//Prenche combobox Cidade
// CIDADES (N:N: retorna ARRAY)
function preencherCbxCidade(idEmpresas, form) {
  const cbx = form.find('#selectCidade');
  cbx.empty(); // Limpa antes de preencher
  $.ajax({
    url: '/listar_cbxCidade',
    type: 'POST',
    dataType: 'json',
    data: { id_empresas: idEmpresas },
    success: function (data) {
      const inicio = '<option value="" disabled selected hidden>Selecione a Cidade...</option>';
      cbx.append(inicio);
      data.forEach(os => {
        const linha = `
                        <option value="${os.id_cidade}">${os.nome}</option>
                        `;
        cbx.append(linha);
      });
      if (data.length === 1) {
        cbx.val(data[0].id_cidade).trigger('change');
      }
    },
    error: function (xhr) {
      alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da tabela');
    }
  });
}


//Prenche combobox Responsavel
function preencherCbxResponsavel() {
  const cbx = $('#selectResponsavel');
  cbx.empty(); // Limpa antes de preencher
  $.ajax({
    url: '/listar_cbxResponsavel',
    type: 'POST',
    success: function (data) {
      const inicio = '<option value="" disabled selected hidden>Selecione o Responsável...</option>';
      cbx.append(inicio);
      data.forEach(os => {
        const linha = `
                        <option value="${os.id}">${os.nome}</option>
                        `;
        cbx.append(linha);
      });
    },
    error: function (xhr) {
      alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da tabela');
    }
  });
}

//Prenche combobox Colaboradores
function preencherCbxColaborador() {
  const cbx = $('#selectColaborador');
  cbx.empty();

  return $.ajax({
    url: '/listar_cbxColaborador',
    type: 'POST',
    dataType: 'json'
  }).done(function (data) {
    const inicio = '<option value="" disabled selected hidden>Selecione o Colaborador...</option>';
    cbx.append(inicio);
    data.forEach(os => {
      cbx.append(`<option value="${os.id}">${os.nome}</option>`);
    });
  }).fail(function (xhr) {
    alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da cbx Colaborador');
  });
}

//Prenche combobox Exames
function preencherCbxExame() {
  const cbx = $('#selectExame');
  cbx.empty();

  return $.ajax({
    url: '/listar_cbxExame',
    type: 'POST',
    dataType: 'json'
  }).done(function (data) {
    const inicio = '<option value="" disabled selected hidden>Selecione o Exame...</option>';
    cbx.append(inicio);
    data.forEach(os => {
      cbx.append(`<option value="${os.idexame}">${os.nome}</option>`);
    });
  }).fail(function (xhr) {
    alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da cbx Exame');
  });
}

//Prenche combobox Cursos
function preencherCbxCurso() {
  const cbx = $('#selectCurso');
  cbx.empty();

  return $.ajax({
    url: '/listar_cbxCurso',
    type: 'POST',
    dataType: 'json'
  }).done(function (data) {
    const inicio = '<option value="" disabled selected hidden>Selecione o Curso...</option>';
    cbx.append(inicio);
    data.forEach(os => {
      cbx.append(`<option value="${os.id}">${os.nome}</option>`);
    });
  }).fail(function (xhr) {
    alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da cbx Curso');
  });
}


//Prenche combobox EPI
function preencherCbxEPI() {
  const cbx = $('#selectEPI');
  cbx.empty();

  return $.ajax({
    url: '/listar_cbxEPI',
    type: 'POST',
    dataType: 'json'
  }).done(function (data) {
    const inicio = '<option value="" disabled selected hidden>Selecione o EPI...</option>';
    cbx.append(inicio);
    data.forEach(epi => {
      cbx.append(`<option value="${epi.id}">${epi.nome}</option>`);
    });
  }).fail(function (xhr) {
    alert(xhr.responseJSON?.error || xhr.responseText || 'Erro no carregamento da cbx EPI');
  });
}