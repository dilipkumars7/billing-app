import React from 'react'
import Table from '../components/Table'


export default function list() {

  const Header =[
    {
      headerName: "Device Name",
      field: "device_name",
      defaultWidth: "300",
    },
    {
      headerName: "Device Code",
      field: "device_code",
      defaultWidth: "300",
    },
    {
      headerName: "Zone Name",
      field: "zone_name",
      defaultWidth: "300",
    },
    {
      headerName: "Date",
      field: "date",
      defaultWidth: "300",
    },
    {
      headerName: "FFFFG",
      field: "FFFFG",
      defaultWidth: "300",
    },
    {
      headerName: "FFFFG12",
      field: "FFFFG12",
      defaultWidth: "200",
    }
  ]


  return (
    <div>
      <h2>My Jira-Style List View</h2>
      <Table TableHeader={Header} TableData={Data} />
    </div>
  )
}


const Data = [
    {
      "5RTR": 16.8853,
      "date": "2025-10-29",
      "FFFFG": 8.7099,
      "GENW1": 3.9192,
      "FFFFG12": 18.6875,
      "SHIFT 2": 80.7822,
      "zone_name": "Utility",
      "GENERAL134": 68.4717,
      "NIGHT SHIFT": 86.7779,
      "consumption": 284.2337,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 0,
      "date": "2025-10-30",
      "FFFFG": 8.5996,
      "GENW1": 4.0773,
      "FFFFG12": 0,
      "SHIFT 2": 0,
      "zone_name": "Utility",
      "GENERAL134": 0,
      "NIGHT SHIFT": 85.5574,
      "consumption": 98.2343,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 16.8853,
      "date": "2025-10-29",
      "FFFFG": 8.7099,
      "GENW1": 3.9192,
      "FFFFG12": 18.6875,
      "SHIFT 2": 80.7822,
      "zone_name": "Utility",
      "GENERAL134": 68.4717,
      "NIGHT SHIFT": 86.7779,
      "consumption": 284.2337,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 0,
      "date": "2025-10-30",
      "FFFFG": 8.5996,
      "GENW1": 4.0773,
      "FFFFG12": 0,
      "SHIFT 2": 0,
      "zone_name": "Utility",
      "GENERAL134": 0,
      "NIGHT SHIFT": 85.5574,
      "consumption": 98.2343,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 16.8853,
      "date": "2025-10-29",
      "FFFFG": 8.7099,
      "GENW1": 3.9192,
      "FFFFG12": 18.6875,
      "SHIFT 2": 80.7822,
      "zone_name": "Utility",
      "GENERAL134": 68.4717,
      "NIGHT SHIFT": 86.7779,
      "consumption": 284.2337,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 0,
      "date": "2025-10-30",
      "FFFFG": 8.5996,
      "GENW1": 4.0773,
      "FFFFG12": 0,
      "SHIFT 2": 0,
      "zone_name": "Utility",
      "GENERAL134": 0,
      "NIGHT SHIFT": 85.5574,
      "consumption": 98.2343,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 16.8853,
      "date": "2025-10-29",
      "FFFFG": 8.7099,
      "GENW1": 3.9192,
      "FFFFG12": 18.6875,
      "SHIFT 2": 80.7822,
      "zone_name": "Utility",
      "GENERAL134": 68.4717,
      "NIGHT SHIFT": 86.7779,
      "consumption": 284.2337,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 0,
      "date": "2025-10-30",
      "FFFFG": 8.5996,
      "GENW1": 4.0773,
      "FFFFG12": 0,
      "SHIFT 2": 0,
      "zone_name": "Utility",
      "GENERAL134": 0,
      "NIGHT SHIFT": 85.5574,
      "consumption": 98.2343,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 16.8853,
      "date": "2025-10-29",
      "FFFFG": 8.7099,
      "GENW1": 3.9192,
      "FFFFG12": 18.6875,
      "SHIFT 2": 80.7822,
      "zone_name": "Utility",
      "GENERAL134": 68.4717,
      "NIGHT SHIFT": 86.7779,
      "consumption": 284.2337,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 0,
      "date": "2025-10-30",
      "FFFFG": 8.5996,
      "GENW1": 4.0773,
      "FFFFG12": 0,
      "SHIFT 2": 0,
      "zone_name": "Utility",
      "GENERAL134": 0,
      "NIGHT SHIFT": 85.5574,
      "consumption": 98.2343,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 16.8853,
      "date": "2025-10-29",
      "FFFFG": 8.7099,
      "GENW1": 3.9192,
      "FFFFG12": 18.6875,
      "SHIFT 2": 80.7822,
      "zone_name": "Utility",
      "GENERAL134": 68.4717,
      "NIGHT SHIFT": 86.7779,
      "consumption": 284.2337,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    },
    {
      "5RTR": 0,
      "date": "2025-10-30",
      "FFFFG": 8.5996,
      "GENW1": 4.0773,
      "FFFFG12": 0,
      "SHIFT 2": 0,
      "zone_name": "Utility",
      "GENERAL134": 0,
      "NIGHT SHIFT": 85.5574,
      "consumption": 98.2343,
      "device_code": "D0001",
      "device_name": "Chiller-1 75 TR"
    }
  ]