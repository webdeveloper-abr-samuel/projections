$(async () => {
  
  await Data({
    periodos: app.items2, 
    ambito: app.ambito, 
    escala: app.escala, 
    porcentaje: app.percentage
  });

  $('.event').on('click', async function() {
    $(".sk-cube-grid").show()
    const month = app.items2.map((item)=> item.id)
    await Data({
      periodos: month, 
      ambito: app.ambito, 
      escala: app.escala, 
      porcentaje: app.percentage
    })
  });

  async function Data(values) {
    const response = await fetch('http://localhost:4000/recargos/Predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });    
    const data = await response.json();
    data == "" ? $(".sk-cube-grid").show() : $(".sk-cube-grid").hide();
    const datos = data.datos;
    valores(datos);
    const total_year = data.total_year;
    const percentage_increment = data.percentage_increment;
  
    var totalYear = document.getElementById('total_year');
    totalYear.innerHTML = total_year.toLocaleString('en-US');
    var percentageIncrement = document.getElementById('percentage_increment');
    percentageIncrement.innerHTML = (Math.round(percentage_increment * 10000)/100).toFixed(2) + '%'; 
  }
  
    function valores (datos) {
    const pivotGridChart = $('#pivotgrid-chart').dxChart({
      commonSeriesSettings: {
        type: 'bar',
      },
      tooltip: {
        enabled: true,
        format: 'currency',
        customizeTooltip(args) {
          return {
            html: `${args.seriesName} | Total<div class='currency'>${args.valueText}</div>`,
          };
        },
      },
      size: {
        height: 200,
      },
      adaptiveLayout: {
        width: 450,
      },
    }).dxChart('instance');

    const pivotGrid = $('#pivotgrid').dxPivotGrid({
      allowSortingBySummary: true,
      allowFiltering: true,
      showBorders: true,
      showColumnGrandTotals: true,
      showRowGrandTotals: true,
      showRowTotals: false,
      showColumnTotals: false,
      fieldPanel: {
        showColumnFields: true,
        showDataFields: true,
        showFilterFields: true,
        showRowFields: true,
        allowFieldDragging: true,
        visible: true,
      },
      headerFilter: {
        allowSearch: true,
        showRelevantValues: true,
        width: 300,
        height: 400,
      },
      fieldChooser: {
        allowSearch: true,
        enabled: true,
        height: 400,
      },
      dataSource: {
        fields: [{
          caption: 'Categoria',
          width: 120,
          dataField: 'categoria',
          area: 'row',
          sortBySummaryField: 'Total',
        }, {
          caption: 'Subcategoria',
          dataField: 'parte',
          width: 150,
          area: 'row',
        },{
          caption: 'Asesor',
          dataField: 'asesor',
          width: 150,
          area: 'row',
        },{
          caption: 'Cliente',
          dataField: 'nombre',
          width: 150,
          area: 'row',
        }, {
          dataField: 'mes',
          area: 'column',
        }, {
          groupName: 'date',
          groupInterval: 'month',
          visible: false,
        }, {
          caption: 'Total',
          dataField: 'amount',
          dataType: 'number',
          summaryType: 'sum',
          format: 'currency',
          area: 'data',
        }],
        store: datos,
      },
    }).dxPivotGrid('instance');

    pivotGrid.bindChart(pivotGridChart, {
      dataFieldsDisplayMode: 'splitPanes',
      alternateDataFields: false,
    });
  }



});