const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch(`${apiUrl}api/data`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const userData = await response.json();
                setData(userData);
                console.log("Fetched user data:", userData); // Check if data is set
            } else {
                console.error('Failed to fetch data:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
};