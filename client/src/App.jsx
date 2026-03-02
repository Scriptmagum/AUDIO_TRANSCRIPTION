import './App.css'
import { BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import TokenGene from './pages/Token'



function App() {
  

  return (
    


    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/apikey" element={<TokenGene />} />
      </Routes>
    </BrowserRouter>

    
    
  )
}

export default App