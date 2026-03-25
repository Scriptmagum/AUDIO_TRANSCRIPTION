import './App.css'
import { BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './pages/Home'
import TokenGene from './pages/Token'
import Upload from './pages/Upload'
import Record from './pages/Record'



function App() {
  

  return (
    


    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/apikey" element={<TokenGene />} />

        <Route path="/upload" element={<Upload />} />

        <Route path="/record" element={<Record />} />
      </Routes>
    </BrowserRouter>

    
    
  )
}

export default App