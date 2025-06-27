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
      <div style={{ width: '220px', height: '220px' }}>
        <RiveComponent 
          style={{ 
            width: '100%', 
            height: '100%',
            imageRendering: 'auto',
          }}
        />
      </div>
    </div>
  )
}

export default App
