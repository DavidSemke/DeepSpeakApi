const consts = require("../../../models/constants/room")

const inputData = [
  {
    topic: "Sad gerbil",
  },
  {
    topic: "Glad squirrel",
  },
  {
    topic: "Bad hurtle",
  },
  {
    topic: "Mad turtle",
  },
  {
    topic: "Fad purple",
  },
  {
    topic: "Lad circle",
  },
]

function getData(messages) {
  if (messages.length < consts.MESSAGES_LENGTH.max) {
    throw new Error("Not enough unique messages to meet max messages length")
  }

  const baseDate = new Date()
  const completeData = inputData.map((data, index) => {
    const createDate = new Date(baseDate.getTime())
    createDate.setMinutes(baseDate.getMinutes() + index)
    const deleteDate = new Date(baseDate.getTime())
    deleteDate.setMinutes(baseDate.getMinutes() + index + 1)

    // at least one message to a room (empty room case insignificant)
    let messageSlice = messages.slice(index % messages.length)

    const users = []
    for (const msg of messageSlice) {
      if (!users.includes(msg.user)) {
        users.push(msg.user)
      }
    }

    return {
      ...data,
      create_date: createDate,
      delete_date: deleteDate,
      max_user_count: Math.max(users.length + (index % 2), 2),
      users,
      messages: messageSlice,
    }
  })

  return completeData
}

module.exports = {
  getData,
}
