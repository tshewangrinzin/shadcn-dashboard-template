// React Imports
import type { ReactNode } from 'react'

// Router Imports
import { Outlet } from 'react-router-dom'

type Props = {
  children?: ReactNode
}

const BlankLayout = ({ children }: Props) => {
  return <div className='h-full w-full'>{children ?? <Outlet />}</div>
}

export default BlankLayout