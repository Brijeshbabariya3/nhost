import { useState } from 'react'
import { FaMinus } from 'react-icons/fa'
import { RemoveSecurityKeyMutation, SecurityKeysQuery } from 'src/generated'

import { gql, useMutation } from '@apollo/client'
import { ActionIcon, Button, Card, SimpleGrid, Table, TextInput, Title } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { useAddSecurityKey, useUserId } from '@nhost/react'
import { useAuthQuery } from '@nhost/react-apollo'

const SECURITY_KEYS_LIST = gql`
  query securityKeys($userId: uuid!) {
    authUserAuthenticators(where: { userId: { _eq: $userId } }) {
      id
      nickname
    }
  }
`

const REMOVE_SECURITY_KEY = gql`
  mutation removeSecurityKey($id: uuid!) {
    deleteAuthUserAuthenticator(id: $id) {
      id
    }
  }
`

export const SecurityKeys: React.FC = () => {
  const { add } = useAddSecurityKey()
  const userId = useUserId()
  const [nickname, setNickname] = useInputState('')
  const [list, setList] = useState<{ id: string; nickname?: string | null }[]>([])
  useAuthQuery<SecurityKeysQuery>(SECURITY_KEYS_LIST, {
    variables: { userId },
    onCompleted: ({ authUserAuthenticators }) => {
      if (authUserAuthenticators) {
        setList(authUserAuthenticators || [])
      }
    }
  })

  const addKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const { key, error } = await add(nickname)
    if (error) {
      console.log(error)
    } else {
      setNickname('')
    }
    if (key) {
      setList([...list, key])
    }
  }
  const [removeKey] = useMutation<RemoveSecurityKeyMutation>(REMOVE_SECURITY_KEY, {
    onCompleted: ({ deleteAuthUserAuthenticator }) => {
      if (deleteAuthUserAuthenticator?.id) {
        setList(list.filter((item) => item.id !== deleteAuthUserAuthenticator.id))
      }
    }
  })

  return (
    <Card shadow="sm" p="lg" m="sm">
      <Title>Security keys</Title>
      <Table style={{ width: '100%', maxWidth: '100%' }}>
        <colgroup>
          <col />
          <col width="20%" />
        </colgroup>
        <tbody>
          {list.map(({ id, nickname }) => (
            <tr key={id}>
              <td>{nickname || id}</td>
              <td>
                <ActionIcon onClick={() => removeKey({ variables: { id } })} color="red">
                  <FaMinus />
                </ActionIcon>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <form onSubmit={addKey}>
        <SimpleGrid cols={2}>
          <TextInput
            autoFocus
            value={nickname}
            onChange={setNickname}
            placeholder="Nickname for the device (optional)"
          />
          <Button type="submit">Add a new device</Button>
        </SimpleGrid>
      </form>
    </Card>
  )
}
