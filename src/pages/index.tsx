import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Home() {
  const [data, setData] = useState(null);
  const [userInfo, setUserInfo] = useState({ name: '', country: '' });
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState(null);
  const [tokenData, setTokenData] = useState(null);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('jwt');
      const response = await axios.get('http://localhost:3001/api/data', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setData(response.data);
    } catch (error) {
      console.log(error);
      if (error.response && error.response.status === 401) {
        try {
          if(ticket === null){
            const ticketResponse = await axios.post('http://localhost:3001/api/ticket');
            setTicket(ticketResponse.data.ticket);
          }
        } catch (ticketError) {
          setError('Failed to obtain ticket');
        }
      } else {
        setError('Failed to fetch data');
      }
    }
  };

  const fetchUserInfo = async () => {
    try {
      const token = sessionStorage.getItem('jwt');
      const response = await axios.get('http://localhost:3001/api/info', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserInfo(response.data);
    } catch (error) {
      console.log('Failed to fetch user info', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (ticket) {
      const interval = setInterval(async () => {
        try {
          const tokenResponse = await axios.post(`http://localhost:3001/api/token`, {
            ticketId: ticket
          });
          if (tokenResponse.status === 200) {
            sessionStorage.setItem('jwt', tokenResponse.data);
            setTokenData(tokenResponse.data);
            clearInterval(interval);
          }
        } catch {
          // Handle polling errors if necessary
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [ticket]);

  useEffect(() => {
    if (tokenData) {
      fetchData();
      fetchUserInfo();
    }
  }, [tokenData]);

  // Polling for data every 5 seconds
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchData();
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('jwt');
    setData(null);
    setUserInfo({ name: '', country: '' });
    setTicket(null);
    setTokenData(null);

    // Refresh the page
    window.location.reload();
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!data) {
    if (ticket) {
      return (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Informacija prieinama tik patvirtinus savo tapatybę</h1>
          <form
            action="https://test.epaslaugos.lt/portal/external/services/authentication/v2/"
            method="post"
            target="_blank"
            className="flex flex-col items-start">
            <input name="ticket" value={ticket} type="hidden" />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200">
              Prisijungti per VIISP
            </button>
          </form>
        </div>
      );
    } else {
      return <div className="text-gray-500">Loading...</div>;
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">
        {userInfo.name}, {userInfo.country}
      </h1>
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="border px-4 py-2">Kodas</th>
            <th className="border px-4 py-2">Miestas</th>
            <th className="border px-4 py-2">Imone</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">{item.kodas}</td>
              <td className="border px-4 py-2">{item.miestas}</td>
              <td className="border px-4 py-2">{item.imone}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200 mt-4">
        Atsijungti
      </button>
    </div>
  );
}