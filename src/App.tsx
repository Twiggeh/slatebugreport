import { useState } from 'react';
import Editor from './Editor';

function App() {
	const [count, setCount] = useState(0);
	return (
		<div className='App'>
			<Editor></Editor>
		</div>
	);
}

export default App;
