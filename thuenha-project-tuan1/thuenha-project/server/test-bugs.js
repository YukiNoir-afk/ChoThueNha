async function runTests() {
  const baseUrl = 'http://localhost:4000/api';
  
  // 1. Login to get cookie and CSRF
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@thuenha.vn', password: 'admin12345' })
  });
  const loginData = await loginRes.json();
  const csrfToken = loginData.csrfToken;
  
  // Extract set-cookie array manually from headers object
  const cookieHeader = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie().join('; ') : loginRes.headers.get('set-cookie');
  console.log('Login CSRF:', csrfToken ? 'OK' : 'FAIL');

  // 2. GET /api/listings/:id
  const getRes = await fetch(`${baseUrl}/listings/1`);
  const getData = await getRes.json();
  console.log('GET /api/listings/1:', getRes.status === 200 && getData.id === 1 ? 'OK' : 'FAIL', getRes.status);

  // 3. POST /api/listings
  const postRes = await fetch(`${baseUrl}/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
      'cookie': cookieHeader
    },
    body: JSON.stringify({
      titleVi: "Phòng trọ test API",
      titleEn: "Test room",
      descVi: "Phòng trọ sạch đẹp",
      descEn: "Clean room",
      price: 5000000,
      area: 25,
      bedrooms: 1,
      type: "room",
      lat: 10.7721,
      lng: 106.6981,
      address: "123 Lê Lợi",
      amenities: ["wifi"]
    })
  });
  const postData = await postRes.json();
  console.log('POST /api/listings:', postRes.status === 201 && postData.id ? 'OK' : 'FAIL', postRes.status, postData.error?.message || '');
  const newId = postData.id;

  // 4. PUT /api/listings/:id
  if (newId) {
    const putRes = await fetch(`${baseUrl}/listings/${newId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'cookie': cookieHeader
      },
      body: JSON.stringify({
        price: 6000000
      })
    });
    const putData = await putRes.json();
    console.log('PUT /api/listings/:id:', putRes.status === 200 && putData.price === 6000000 ? 'OK' : 'FAIL', putRes.status);
  }

  // 5. GET /api/listings?type=giá_trị_sai (ZodError)
  const errRes = await fetch(`${baseUrl}/listings?type=invalid_type`);
  const errData = await errRes.json();
  console.log('GET /api/listings ZodError:', errRes.status === 400 && errData.error?.message === 'Dữ liệu không hợp lệ' ? 'OK' : 'FAIL', errRes.status, errData);

}

runTests().catch(console.error);
