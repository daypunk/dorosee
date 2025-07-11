import { useState, useEffect } from 'react';

const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('브라우저에서 위치 서비스를 지원하지 않습니다.');
      setLoading(false);
      return;
    }

    const getCurrentPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(position.timestamp)
          });
          setLoading(false);
          console.log('현재 위치:', position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          let errorMessage = '위치를 가져올 수 없습니다.';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '위치 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 요청 시간이 초과되었습니다.';
              break;
          }
          
          setError(errorMessage);
          setLoading(false);
          console.error('위치 오류:', errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    };

    getCurrentPosition();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });
      },
      (error) => {
        console.warn('위치 추적 오류:', error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 600000
      }
    );

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const refreshLocation = () => {
    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date(position.timestamp)
        });
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return { 
    location, 
    error, 
    loading, 
    refreshLocation 
  };
};

export default useGeolocation;