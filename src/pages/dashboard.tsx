import { Checkbox } from '../components/ui/checkbox'
import { DatePicker } from 'antd';

export default function dashboard() {
  return (
    <>
      <Checkbox defaultChecked>
        Label
      </Checkbox>
       <DatePicker />
      <span className='text-[2rem] font-[400]'>Dashboard</span>
    </>
  )
}
