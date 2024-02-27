const consts = require('../../../models/constants/room')


const inputData = [
  {
    topic: "Sad world",
  },
  {
    topic: "Glad world",
  },
  {
    topic: "Bad world",
  },
  {
    topic: "Mad world",
  },
  {
    topic: "Fad world",
  },
  {
    topic: "Lad world",
  },
]

function getData(messages) {
  const baseDate = new Date()
  const completeData = inputData.map((data, index) => {
    const createDate = new Date(baseDate.getTime())
    createDate.setMinutes(baseDate.getMinutes() + index)
    const deleteDate = new Date(baseDate.getTime())
    deleteDate.setMinutes(baseDate.getMinutes() + index + 1)
    
    let messageSlice = []

    // Make final room empty
    // Full and partially full rooms already exist
    if (index < inputData.length - 1) {
      messageSlice = messages.slice(index)
    }
    
    const users = []
    for (const msg of messageSlice) {
      if (!users.includes(msg.user)) {
        users.push(msg.user)
      }
    }

    // First room has max messages (uses duplicate messages)
    if (index === 0) {
      const originals = [...messageSlice]
      const { max } = consts.MESSAGES_LENGTH
      
      while (messageSlice.length < max) {
        messageSlice.push(...originals)
      }

      messageSlice = messageSlice.slice(0, max)
    }

    return {
      ...data,
      create_date: createDate,
      delete_date: deleteDate,
      max_user_count: Math.max(users.length + (index % 2), 2),
      users,
      messages: messageSlice
    }
  })

  return completeData
}

module.exports = {
  getData,
}