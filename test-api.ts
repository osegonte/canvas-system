async function testAPI() {
  const response = await fetch('http://localhost:3000/api/generate-scaffold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'GPS-verified farm worker attendance system with mobile check-in and payroll integration',
      workspaceId: '12e9a554-3c7e-40d8-a209-a903bad9919c',
      projectName: 'ClockOut Test'
    })
  })

  const data = await response.json()
  console.log('Response:', JSON.stringify(data, null, 2))
}

testAPI()