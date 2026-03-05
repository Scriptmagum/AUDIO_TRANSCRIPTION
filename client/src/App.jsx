import './App.css'
import { BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import TokenGene from './pages/Token'
import Upload from './pages/Upload'



function App() {
  

  return (
    


    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/apikey" element={<TokenGene />} />

        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>

    
    
  )
}

export default App