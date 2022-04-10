
let photoshop = require("photoshop")
let { storage } = require("uxp");
let fs = storage.localFileSystem

const { core, app, action } = photoshop
let folderName

let dirPath

const selectLayerByID = async (layerID) => {
	const actionObject = [
		{
			_obj: 'select',
			_target: [
				{
					_ref: 'layer',
					_id: layerID,
				},
			],
			makeVisible: false,
			layerID: [layerID],
			_isCommand: false,
		},
	];
	await app.batchPlay(actionObject, { modalBehavior: 'execute' });
};

const exportLayerAsPng = async (layer) => {
	let name = ``
	let keys = Object.keys(layer)

	for (let key of keys) {
		let value = layer[key]
		name += `${key}:${value};`
	}

	layer.name = name + `parent:${layer.parent ? layer.parent._id : "-1"};bounds:${layer.bounds.left},${layer.bounds.top}`

	await core.executeAsModal(
		async () => {
			const exportCommand = {
				_obj: 'exportSelectionAsFileTypePressed',
				_target: { _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' },
				fileType: 'png',
				quality: 32,
				metadata: 0,
				destFolder: dirPath,
				sRGB: true,
				openWindow: false,
				_options: { dialogOptions: 'dontDisplay'},
			};
			await action.batchPlay([exportCommand], { modalBehavior: 'execute' });
		},
		{ commandName: `Export ${layer.name} As PNG`}
	);

	return null;
};

async function exportLayers() {
	const allLayers = app.activeDocument.layers
	let pathName = document.getElementById("pathName")

	folderName = pathName.value
	pathName.value = ""

	if (folderName.length < 1) {
		let warning = document.createElement("div")
		warning.innerHTML = "Please set a export name first"
		document.appendChild(warning)

		setTimeout(() => {
			warning.remove()
		}, 1000)

		return
	}

	fs.getTemporaryFolder().then((tempFolder) => {
		[ dirPath ] = tempFolder.nativePath.match(/C:\\Users\\\w+\\/)

		dirPath += "Downloads"
		dirPath += `\\${folderName}`

		let progress = (i) => {
			let layer = allLayers[i]
	
			selectLayerByID(layer._id).then(() => {
				exportLayerAsPng(layer).then(() => {
					if (i >= allLayers.length - 1) {
						return
					}
		
					setTimeout(() => progress(i + 1), 250)
				}).catch((e) => {
					console.log(e)
				})
			});
		}
	
		progress(0)
	}).catch(e => console.warn(e));
}

document.getElementById("btnPopulate").addEventListener("click", exportLayers);