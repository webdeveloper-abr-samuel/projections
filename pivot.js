var app = new Vue({
  el: '#app',
  data: {
    condition: 1,
    filter: 1,
    seeBy: '',
    items: [],
    items2: [],
    percentage: "",
    ambito: 3,
    escala: 1
  },
  created() {
    this.month_data();
  },
  methods: {
    log: function (element, index, id) {
      if (id == 1) {
        this.items.splice(index, 1);
        this.items2.push(element)
      } else {
        this.items2.splice(index, 1);
        this.items.push(element)
      }
    },
    changeTab: function (option) {
      return this.condition = option
    },
    orderList: function () {
      this.items.sort(function (a, b) {
        return a.id - b.id;
      });

      this.items2.sort(function (a, b) {
        return a.id - b.id;
      });
    },
    month_data: function () {
      var meses = [{
        name: 'Enero',
        id: 1
      }, {
        name: 'Febrero',
        id: 2
      }, {
        name: 'Marzo',
        id: 3
      }, {
        name: 'Abril',
        id: 4
      }, {
        name: 'Mayo',
        id: 5
      }, {
        name: 'Junio',
        id: 6
      }, {
        name: 'Julio',
        id: 7
      }, {
        name: 'Agosto',
        id: 8
      }, {
        name: 'Septiembre',
        id: 9
      }, {
        name: 'Octubre',
        id: 10
      }, {
        name: 'Noviembre',
        id: 11
      }, {
        name: 'Diciembre',
        id: 12
      }]
      this.items = []
      meses.forEach(element => {
        this.items.push(element)
      });
    },
    see_by: function (id) {
      id == 1 ? this.conditionalCase(this.seeBy, id) : this.conditionalCase(this.seeBy_two, id)
    },
    conditionalCase: function (option, id) {
      switch (option) {
        case 'month':
          this.currentMonth(id)
          break;
        case 'quarter_one':
          this.conditionalMonth(id, 0, 3)
          break;
        case 'quarter_two':
          this.conditionalMonth(id, 3, 6)
          break;
        case 'quarter_three':
          this.conditionalMonth(id, 6, 9)
          break;
        case 'quarter_four':
          this.conditionalMonth(id, 9, 12)
          break;
        case 'semester_one':
          this.conditionalMonth(id, 0, 6)
          break;
        case 'semester_two':
          this.conditionalMonth(id, 6, 12)
          break;
        case 'all_year':
          this.conditionalMonth(id, 0, 12)
          break;
        default:
          break;
      }
    },
    conditionalMonth: function (select, dayOne, dayTwo) {
      if (select == 1) {
        this.month_data()
        this.items2 = []
        let new_list_one = this.items.filter(list => list.id <= dayOne || list.id > dayTwo);
        let quarter_one = this.items.filter(list => list.id > dayOne && list.id <= dayTwo);
        this.items = []
        new_list_one.forEach(element => this.items.push(element));
        quarter_one.forEach(element => this.items2.push(element));
      }
    },
    currentMonth: function (id) {
      if (id == 1) {
        this.month_data()
        this.items2 = []
        const date = new Date();
        const id = date.getMonth() + 1;
        let del = this.items.filter(list => list.id !== id);
        let up = this.items.filter(list => list.id == id);
        this.items = []
        del.forEach(element => this.items.push(element));
        this.items2.push(up[0])
      }
    }
  }
})

$(async () => {

  var URL = "http://localhost:4000/recargos/Predict"

  /* var bodyFormData = new FormData();
  bodyFormData.append('periodos', app.items2);
  bodyFormData.append('ambito', app.ambito);
  bodyFormData.append('escala', app.escala); */

  await Data({
    periodos: app.items2,
    ambito: app.ambito,
    escala: app.escala
  });

  $('.event').on('click', async function () {
    $(".sk-cube-grid").show()
    const month = app.items2.map((item) => item.id)
    await Data({
      periodos: month,
      ambito: app.ambito,
      escala: app.escala,
      porcentaje: app.percentage
    })
  });

  async function Data(values) {
    const response = await fetch(`${URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    const date = new Date();
    const year = date.getFullYear();
    const before = year - 2;
    const after = year - 1;
    const respuesta = await response.json();
    const result = respuesta.result;
    const total_after = respuesta.total_after;

    const data = [...result.reduce((r, o) => {
      const key = o.asesor + '-' + o.mes + '-' + o.parte + '-' + o.year + '-' + o.categoria + '-' + o.nombre;
      const item = r.get(key) || Object.assign({}, o, {
        total: 0
      });
      item.total += o.total;
      return r.set(key, item);
    }, new Map).values()];

    let dataOrganized = data.reduce((acc, cur) => {
      let { asesor, mes, parte, categoria, nombre, ...rest } = cur;
      let ex = acc.find(x => x.asesor === asesor && x.mes === mes && x.parte === parte && x.categoria === categoria && x.nombre === nombre);
      if (!ex) {
        ex = { asesor, mes, parte, categoria, nombre, salesYear: [] };
        acc.push(ex);
      }
      ex.salesYear.push(rest);
      return acc;
    }, [])

    for (let i = 0; i < dataOrganized.length; i++) {
      for (let j = before; j <= after; j++) {
        const values = dataOrganized[i].salesYear.find(saleYear => saleYear.year === j)
        if (!values) {
          dataOrganized[i].salesYear.push({ year: j, total: 0 })
        }
      }
    }

    let datos = []
    let data_temp = [];
    let category_products = []
    for (let i = 0; i < dataOrganized.length; i++) {
      for (let j = 0; j < dataOrganized[i].salesYear.length; j++) {
        if (dataOrganized[i].salesYear[j + 1] != undefined) {
          data_temp.push(dataOrganized[i].salesYear[j + 1].total - dataOrganized[i].salesYear[j].total);
        }
      }
      let count = data_temp.length;
      let suma = data_temp.reduce((previous, current) => current += previous)
      let promedio = suma / count
      let predict = promedio + dataOrganized[i].salesYear[count].total
      let porcentajes = predict * (app.percentage / 100)
      let add_delete = predict + porcentajes
      let predict_porcentage = app.percentage == "" ? predict : add_delete
      datos.push({
        asesor: dataOrganized[i].asesor,
        mes: dataOrganized[i].mes,
        parte: dataOrganized[i].parte,
        categoria: dataOrganized[i].categoria,
        nombre: dataOrganized[i].nombre,
        amount: Math.abs(predict_porcentage)
      })
      category_products.push({
        mes: dataOrganized[i].mes,
        categoria: dataOrganized[i].categoria,
        amount: Math.abs(predict_porcentage)
      })
      data_temp = []
    }

    datos == "" ? $(".sk-cube-grid").show() : $(".sk-cube-grid").hide();
    valores(datos)

    const month_category = [...category_products.reduce((r, o) => {
      const key = o.mes + '-' + o.categoria;
      const item = r.get(key) || Object.assign({}, o, {
        amount: 0
      });
      item.amount += o.amount;
      return r.set(key, item);
    }, new Map).values()];

    const total_category = []
    month_category.reduce(function (res, value) {
      if (!res[value.categoria]) {
        res[value.categoria] = {
          categoria: value.categoria,
          total: 0,
        };
        total_category.push(res[value.categoria]);
      }
      res[value.categoria].total += parseInt(value.amount);
      return res;
    }, {});

    const total_year = total_category.map(item => item.total).reduce((prev, curr) => prev + curr, 0);
    const percentage_increment = total_after.map(item => total_year / item.total - 1)

    var totalYear = document.getElementById('total_year');
    totalYear.innerHTML = total_year.toLocaleString('en-US');

    var percentageIncrement = document.getElementById('percentage_increment');
    percentageIncrement.innerHTML = (Math.round(percentage_increment * 10000) / 100).toFixed(2) + '%';
  }

  function valores(datos) {
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

    window.pivotGrid = $('#pivotgrid').dxPivotGrid({
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
        }, {
          caption: 'Asesor',
          dataField: 'asesor',
          width: 150,
          area: 'row',
        }, {
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