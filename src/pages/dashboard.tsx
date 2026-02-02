import { useEffect } from 'react';
import { DatePicker } from 'antd';
import { useApi } from '../hooks/useApi';
import { CookieService } from '../store/Cookie';
import { PATH } from '../constants/app.constant';


const Dashboard: React.FC = () => {

  const { data:SettingsGet, loading:SettingGetsLoading, error:SettingsGetError} = 
     useApi<any[]>(`${PATH.USER_SETTINGS}/${CookieService.get('user_id')}`, { method: "GET", autoFetch: true });

  useEffect(()=>{
    if(SettingsGet){
      localStorage.setItem("settingsConfig", JSON.stringify(SettingsGet?.settingsConfig));
    }
  }, [SettingsGet])


  return (
    <>
       <DatePicker />
      <span className='text-[2rem] font-[400]'>Dashboard</span>
    </>
  )
}

export default Dashboard
