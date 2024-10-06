import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
  updateDoc,
  increment,
  doc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";


/**
 * 
 * @param {object} newMessage 
 * 
 * Primero se toma la referencia de la collection 'chat' y después con addDoc() se crea el mensaje con el objeto pasado y 
 * algunos datos extras para su seguimiento.
 */

export async function enviarMensajeAfirebase(newMessage) {
  const chatRef = collection(db, "chat");
  await addDoc(chatRef, {
    ...newMessage,
    created_at: serverTimestamp(),
    likes: 0,
    likesBy: [],
    comentarios: 0,
    comentarios_text: [],
  });
}

/**
 * @param {*} id
 * @param {*} userId
 *
 * Esta función lo que busca hacer es permitirle al usuario dar like a los posts. Primero se referencia 
 * el documento del chat al que queremos accionar. Hacemos la búsqueda y si este existe procedemos a realizar 
 * la modificaciones en los datos dando a entender que se likeo el post. El usuario sera agregado a un array de usuarios 
 * y se incrementara el numero de likes. Ademas en caso de que el usuario ya haya dado like si activa la función otra vez, 
 * pasara lo contrario a lo dicho anteriormente.
 *
 */
export async function darLike(id, userId) {
  const postRef = doc(db, "chat", id); 
  const postDoc = await getDoc(postRef); 

  if (postDoc.exists()) {
    const postData = postDoc.data();

    if (!postData.likesBy || !postData.likesBy.includes(userId)) {
      try {
        await updateDoc(postRef, {
          likes: increment(1),
          likesBy: [...(postData.likesBy || []), userId],
        });
      } catch (err) {
        console.log("Error al dar like:", err);
      }
    } else {
      console.log("El usuario ya ha dado like a este mensaje.");
      await updateDoc(postRef, {
        likes: increment(-1),
        likesBy: postData.likesBy.filter((uid) => uid !== userId),
      });
    }
  } else {
    console.log("El mensaje no existe.");
  }
}

export async function enviarComentarioAlPost(comentario, usertag, username, id) {
  const commentRef = collection(db, "comentario");
  await addDoc(commentRef, {
    post: id,
    comentario: comentario,
    usertag: usertag,
    username: username,
    created_at: serverTimestamp(),
  });
  const postRef = doc(db, "chat", id);
  const postDoc = await getDoc(postRef);

  if (postDoc.exists()) {
    const postData = postDoc.data();

    try {
      await updateDoc(postRef, {
        comentarios: increment(1),
      });
    } catch (err) {
      console.log(err);
    }
  }
}

export function getComentariosDelPost(id, callback) {
  const commentsRef = collection(db, "comentario") 
  const q = query(commentsRef, where("post", "==", id));
  
  return onSnapshot(q, (querySnapshot) => {
    const comentarios = [];
    querySnapshot.forEach((doc) => {
      comentarios.push({ id: doc.id, ...doc.data() });
    });
    callback(comentarios); 
  }, (error) => {
    console.error("Error obteniendo comentarios: ", error);
  });
}

export function cambiosEnElChat(callback) {
  const chatRef = collection(db, "chat");
  const q = query(chatRef, orderBy("created_at"));
  onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    callback(messages);
  });
}

/**
 * 
 * @param {string} usertag 
 * @param {*} callback 
 * 
 * Mediante esta función se permite obtener los post un usuario mediante su usertag. Se referencia a una collection, en 
 * este caso a la del chat y después se establece un query el cual tiene como objetivo encontrar al usuario. 
 * Si este existe entonces se devuelve, en otro caso no.
 */
export async function obtenerPostsDeUsuarioById(usertag, callback) {
  const chatRef = collection(db, "chat");
  const q = query(chatRef, where("usertag", "==", usertag));
  onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      return {
        id: doc.id,
        ...doc.data(),
      };
    });
    callback(messages);
  });
}
