'use client'
import dynamic from 'next/dynamic'

const TablePlanner = dynamic(() => import('./TablePlanner'), { ssr: false })

export default TablePlanner
