import { useRive } from '@rive-app/react-canvas'

function App() {
  const { RiveComponent } = useRive({
    src: '/chat_dorosee.riv',
    autoplay: true,
    useOffscreenRenderer: true,
    shouldDisableRiveListeners: false,
  });

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center pt-20">
      <div style={{ width: '300px', height: '300px' }}>
        <RiveComponent 
          style={{ 
            width: '100%', 
            height: '100%',
            imageRendering: 'auto',
            opacity: 0.8
          }}
        />
      </div>
    </div>
  )
}

export default App
