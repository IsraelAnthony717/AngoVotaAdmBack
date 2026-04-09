const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const path = require('path');
const { Image } = require('image-js');



class Modelo {

    async carregarImagem(pasta, label, tamanho = 64){
    const ficheiros = fs.readdirSync(pasta);
    let imagens = [];
    let labels = [];

    for(let ficheiro of ficheiros ){

        //const binario = fs.readFileSync(path.join(pasta, ficheiro));
         const img = await Image.load(path.join(pasta, ficheiro));
        let tensor = tf.tensor3d(img.data, [img.height, img.width, 4]) // RGBA
      .slice([0, 0, 0], [img.height, img.width, 3]) // remove canal alpha
      .resizeNearestNeighbor([tamanho, tamanho])
      .toFloat()
      .div(tf.scalar(255));

      imagens.push(tensor);
      labels.push(label);
    }

    return { imagens, labels };
}


    //Função Para criar o Modelo

    criarModelo(){

        const modelo = tf.sequential();

        modelo.add(tf.layers.conv2d({
            inputShape: [64, 64, 3],
            filters: 32,
            kernelSize: 3,
            activation: 'relu'
        }));

        modelo.add(tf.layers.maxPooling2d({poolSize: [2,2]}));

        modelo.add(tf.layers.flatten());

        modelo.add(tf.layers.dense({units: 64, activation: 'relu'}));

        modelo.add(tf.layers.dense({units: 1, activation: 'sigmoid'}));

        modelo.compile({
            optimizer: tf.train.adam(),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        return modelo;
    }



    // Funçã para treinar Modelo


    async treinarModelo(){

    const validos = await this.carregarImagem(path.join(__dirname, '../dataset/validos'), 1);
    const suspeitos = await this.carregarImagem(path.join(__dirname, '../dataset/suspeitos'),0);

        const totasImagens = tf.stack([...validos.imagens, ...suspeitos.imagens]);

        const totalLabels = tf.tensor([...validos.labels, ...suspeitos.labels]);

        const modelo = this.criarModelo();

        await modelo.fit(totasImagens, totalLabels, {

            epochs: 2,
            batchSize: 3,
            validationSplit: 0.2
        });

         // Guardar arquitetura
const modelJSON = modelo.toJSON();
fs.writeFileSync(path.join(__dirname, 'modelo.json'), JSON.stringify(modelJSON));

// Guardar pesos em binário
const weights = modelo.getWeights();
weights.forEach((w, i) => {
  const data = w.dataSync(); // Float32Array
  fs.writeFileSync(path.join(__dirname, `peso_${i}.bin`), Buffer.from(data.buffer));
});
console.log('Modelo treinado e guardado em modelo.json + pesos binários!');



        console.log('Modelo treinado e guardado!');

        }


    //Função para previsão


  async prever(caminhoImagem) {
  // Reconstrói a arquitetura chamando criarModelo()
  const modelo = this.criarModelo();

  // Carregar pesos binários
  const weights = modelo.getWeights();
  weights.forEach((w, i) => {
    const raw = fs.readFileSync(path.join(__dirname, `peso_${i}.bin`));
    const arr = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
    w.assign(tf.tensor(arr, w.shape));
  });

  // Carregar imagem
  const img = await Image.load(caminhoImagem);
  const tensor = tf.tensor3d(img.data, [img.height, img.width, 4])
    .slice([0, 0, 0], [img.height, img.width, 3])
    .resizeNearestNeighbor([64, 64])
    .toFloat()
    .div(tf.scalar(255))
    .expandDims(0);

  // Prever
  const previsao = modelo.predict(tensor);
  const pontuacao = previsao.dataSync()[0];

  console.log("Pontuação:", pontuacao);
  console.log(pontuacao > 0.5 ? 'Documento Válido' : 'Documento suspeito');

  return {
    pontuacao,
    resultado: pontuacao > 0.5 ? 'Documento Válido' : 'Documento suspeito'
  };
}

}

module.exports =  new Modelo();


