import React from 'react'
import { CreateItem, useList } from '@keystonejs/app-admin-ui/components'
import { saveAs } from 'file-saver'
import { gql } from '@apollo/client'
import client from './../next/lib/graphql-client'
import styles from './ExportCSVButton.module.css'

const ExportCSVButton = () => {
  const listData = useList()
  const { list } = listData
  const firstRecord = listData.listData && listData.listData.items && listData.listData.items[0]
  const queriedFields = firstRecord && Object.keys(firstRecord).filter(f => typeof firstRecord[f] !== 'object')
  console.log(queriedFields)

  const exportCsv = async () => {
    const fieldsToQuery = list.fields.filter(f => f.path !== 'image' && !f.config.many && queriedFields.includes(f.path))
    const queryName = `all${list.key}s`

    const whereInputName = list.gqlNames.whereInputName

    // Construct the query string
    const queryString = `
    query ExportFilteredData($where: ${whereInputName}) {
      ${queryName}(where: $where) {
        ${fieldsToQuery.map(f => f.path).join('\n        ')}
      }
    }
  `

    const query = gql`${queryString}`

    try {
      const { data } = await client.query({
        query,
        variables: {
          where: listData.query.variables.where
        }
      })

      const records = data[queryName]

      if (!records.length) {
        alert('No data to export.')
        return
      }

      // Convert to CSV
      const headers = fieldsToQuery.map(f => f.path)
      const rows = records.map(item =>
        headers.map(key => JSON.stringify(item[key] ?? '')).join(',')
      )

      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      saveAs(blob, `${list.key}_filtered_export.csv`)
    } catch (error) {
      console.error('Error exporting CSV:', error)
      alert('Something went wrong.')
    }
  }

  return (
    <div
      className={styles.exportCSVButton}
      onClick={() => exportCsv()}>
      Export CSV
    </div>
  )
}
export default {
  // re-implement the default delete many and update many items buttons + custom text
  listHeaderActions: () => (
    <div>
      <CreateItem />
      <div style={{ display: 'inline-block' }}><ExportCSVButton /></div>
    </div>
  )
}
