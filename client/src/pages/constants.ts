  export const dashboardCardSchema = [
    {
      title: "Sales",
      xs: 12,
      sm: 6,
      md:7,
      
      children: [
        {
          title: "Total Sales",
          xs: 12,
          sm: 4,
          md:4,
          colour: '#FFF',
          key: "sales.total_sales",
          currency: "Ð",
        },
        {
          title: "Total Orders",
          xs: 12,
          sm: 4,
          md:4,
          colour: '#FFF',
          key: "sales.total_orders",
        },
        {
          title: "Cases Sold",
          xs: 12,
          sm: 4,
          md:4,
          colour: '#FFF',
          key: "sales.cases_sold",
        }
      ]
    },
    {
      title: "Your Balance",
      xs: 12,
      sm: 6,
      md:5,
      children: [
        {
          title: "",
          xs: 12,
          sm: 12,
          md:12,
          colour: '#FFF',
          key: 'bankBalance.balance',
          currency: "Ð",
        },
       
      ]
    },
    {
      title: "Inventory Count",
      xs: 12,
      sm: 5,
      md:6,
      children: [
        {
          title: "Aluminium",
          xs: 12,
          sm: 4,
          md:4,
          colour: '#FFF',
          key: "stock.aluminium",
        },
        {
          title: "Plastic",
          xs: 12,
          sm: 4,
          md:4,
          colour: '#FFF',
          key: "stock.plastic",
          
        },
        {
          title: "Machines",
          xs: 12,
          sm: 4,
          md:4,
          colour: '#FFF',
          key: "stock.machine",
        }
      ]
    },
    {
      title: "Inventory Shipments",
      xs: 12,
      sm: 8,
      md:6,
      children: [
        {
          title: "Placed Orders",
          xs: 12,
          sm: 12,
          md:12,
          colour: '#FFF',
          key: "shipments.places_count"
        }
      ]
    }

  ]