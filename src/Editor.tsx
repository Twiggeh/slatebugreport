import React, { ReactNode, useCallback, useMemo } from 'react';
import isHotkey from 'is-hotkey';
import {
	FormatBold,
	FormatItalic,
	FormatUnderlined,
	Code,
	LooksOne,
	LooksTwo,
	FormatQuote,
	FormatListNumbered,
	FormatListBulleted,
	FormatAlignLeft,
	FormatAlignCenter,
	FormatAlignRight,
	FormatAlignJustify,
} from '@mui/icons-material';
import {
	Editable,
	withReact,
	useSlate,
	Slate,
	RenderElementProps,
	RenderLeafProps,
} from 'slate-react';
import {
	Editor as SlateEditor,
	Transforms,
	createEditor,
	Descendant,
	Element as SlateElement,
	BaseEditor,
} from 'slate';
import { withHistory } from 'slate-history';
import ErrorBoundary from './ErrorBoundary';
import styled from '@emotion/styled';
const Button = ({ value, children }) => {
	return <button>{value}</button>;
};

const HOTKEYS = {
	'mod+b': 'bold',
	'mod+i': 'italic',
	'mod+u': 'underline',
	'mod+`': 'code',
};

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];

const toggleBlock = (editor: BaseEditor, format: string) => {
	const isActive = isBlockActive(
		editor,
		format,
		TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
	);
	const isList = LIST_TYPES.includes(format);

	Transforms.unwrapNodes(editor, {
		match: n =>
			!SlateEditor.isEditor(n) &&
			SlateElement.isElement(n) &&
			LIST_TYPES.includes(n.type) &&
			!TEXT_ALIGN_TYPES.includes(format),
		split: true,
	});
	let newProperties: Partial<SlateElement>;
	if (TEXT_ALIGN_TYPES.includes(format))
		newProperties = {
			align: isActive ? undefined : format,
		};
	else
		newProperties = {
			type: isActive ? 'paragraph' : isList ? 'list-item' : format,
		};

	Transforms.setNodes<SlateElement>(editor, newProperties);

	if (!isActive && isList) {
		const block = { type: format, children: [] };
		Transforms.wrapNodes(editor, block);
	}
};

const toggleMark = (editor: BaseEditor, format: string) => {
	const isActive = isMarkActive(editor, format);

	if (isActive) return SlateEditor.removeMark(editor, format);

	SlateEditor.addMark(editor, format, true);
};

const isBlockActive = (editor: BaseEditor, format: string, blockType = 'type') => {
	const { selection } = editor;
	if (!selection) return false;

	const [match] = Array.from(
		SlateEditor.nodes(editor, {
			at: SlateEditor.unhangRange(editor, selection),
			match: n =>
				!SlateEditor.isEditor(n) && SlateElement.isElement(n) && n[blockType] === format,
		})
	);

	return !!match;
};

const isMarkActive = (editor: BaseEditor, format: string) => {
	const marks = SlateEditor.marks(editor);
	return marks ? marks[String(format)] === true : false;
};

const Element = ({ attributes, children, element }: RenderElementProps) => {
	const style = { textAlign: element.align };
	switch (element.type) {
		case 'block-quote':
			return (
				<blockquote style={style} {...attributes}>
					{children}
				</blockquote>
			);
		case 'bulleted-list':
			return (
				<ul style={style} {...attributes}>
					{children}
				</ul>
			);
		case 'heading-one':
			return (
				<h1 style={style} {...attributes}>
					{children}
				</h1>
			);
		case 'heading-two':
			return (
				<h2 style={style} {...attributes}>
					{children}
				</h2>
			);
		case 'list-item':
			return (
				<li style={style} {...attributes}>
					{children}
				</li>
			);
		case 'numbered-list':
			return (
				<ol style={style} {...attributes}>
					{children}
				</ol>
			);
		default:
			return (
				<p style={style} {...attributes}>
					{children}
				</p>
			);
	}
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
	if (leaf.bold) children = <strong style={{ fontWeight: 'bold' }}>{children}</strong>;

	if (leaf.code) children = <code>{children}</code>;

	if (leaf.italic) children = <em style={{ fontFamily: 'cursive' }}>{children}</em>;

	if (leaf.underline)
		children = <u style={{ textDecoration: 'underline' }}>{children}</u>;

	return <span {...attributes}>{children}</span>;
};

const BlockButton = ({ format, icon }: { format: string; icon: ReactNode }) => {
	const editor = useSlate();
	return (
		<Button
			value={icon}
			variant={
				isBlockActive(
					editor,
					format,
					TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type'
				)
					? 'primary'
					: 'ghost'
			}
			onClick={event => {
				event.preventDefault();
				toggleBlock(editor, format);
			}}
		/>
	);
};

const MarkButton = ({ format, icon }: { format: string; icon: ReactNode }) => {
	const editor = useSlate();
	return (
		<Button
			variant={!isMarkActive(editor, format) ? 'ghost' : 'primary'}
			value={icon}
			onClick={event => {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				event.preventDefault();
				toggleMark(editor, format);
			}}
		/>
	);
};

const initialValue: Descendant[] = [
	{
		type: 'paragraph',
		children: [
			{ text: 'This is editable ' },
			{ text: 'rich', bold: true },
			{ text: ' text, ' },
			{ text: 'much', italic: true },
			{ text: ' better than a ' },
			{ text: '<textarea>', code: true },
			{ text: '!' },
		],
	},
	{
		type: 'paragraph',
		children: [
			{
				text: "Since it's rich text, you can do things like turn a selection of text ",
			},
			{ text: 'bold', bold: true },
			{
				text: ', or add a semantically rendered block quote in the middle of the page, like this:',
			},
		],
	},
	{
		type: 'block-quote',
		children: [{ text: 'A wise quote.' }],
	},
	{
		type: 'paragraph',
		align: 'center',
		children: [{ text: 'Try it out for yourself!' }],
	},
];

const Toolbar = styled.div`
	display: flex;
	background: red;
`;

const Editor = () => {
	const renderElement = useCallback(
		(props: RenderElementProps) => <Element {...props} />,
		[]
	);
	const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
	const editor = useMemo(() => {
		const baseEditor = createEditor();
		const reactEditor = withReact(baseEditor);
		return withHistory(reactEditor);
	}, []);

	return (
		<ErrorBoundary errorMsg='Slate'>
			<Slate editor={editor} value={initialValue}>
				<Toolbar>
					<BlockButton format='heading-one' icon={<LooksOne />} />
					<BlockButton format='heading-two' icon={<LooksTwo />} />
					<BlockButton format='block-quote' icon={<FormatQuote />} />
					<BlockButton format='numbered-list' icon={<FormatListNumbered />} />
					<BlockButton format='bulleted-list' icon={<FormatListBulleted />} />
					<BlockButton format='left' icon={<FormatAlignLeft />} />
					<BlockButton format='center' icon={<FormatAlignCenter />} />
					<BlockButton format='right' icon={<FormatAlignRight />} />
					<BlockButton format='justify' icon={<FormatAlignJustify />} />
					<MarkButton format='bold' icon={<FormatBold />} />
					<MarkButton format='italic' icon={<FormatItalic />} />
					<MarkButton format='underline' icon={<FormatUnderlined />} />
					<MarkButton format='code' icon={<Code />} />
				</Toolbar>

				<ErrorBoundary errorMsg='EDITABLE'>
					<Editable
						renderElement={renderElement}
						renderLeaf={renderLeaf}
						placeholder='Enter some rich text…'
						spellCheck
						autoFocus
						onKeyDown={event => {
							for (const hotkey in HOTKEYS) {
								if (isHotkey(hotkey, event)) {
									event.preventDefault();
									const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
									toggleMark(editor, mark);
								}
							}
						}}
					/>
				</ErrorBoundary>
			</Slate>
		</ErrorBoundary>
	);
};

export default Editor;
