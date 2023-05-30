# Substring API

This API is designed for string manipulation.

It can do the following depending on the endpoint used:

Return the first part of a string  
Return the last part of a string  
Remove the last part of a string and return the rest  
Return a part of the string in the middle specified by start and end points

Although not a substring endpoint, this API also supports converting a date and time to the Unix formatted timestamp

## API Reference

The API base URL is https://substring-api.herokuapp.com  

No Authentication required.

You will need to append one of the endpoints to the end of the URL and provide the correct parameters in the request body.

#### Getfirst

```
  POST /getfirst
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `string` | `string` | **Required**. The string to manipulate |
| `count` | `integer` | **Required**. How many characters of the string to return starting from the start of the string |

```
  Example:
  string = "This is a test"
  count = 4

  Result = "This
```

#### Getlast

```
  POST /getlast
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `string` | `string` | **Required**. The string to manipulate |
| `count` | `integer` | **Required**. How many characters of the string to return starting from the end of the string |

```
  Example:
  string = "This is a test"
  count = 4

  Result = "test"
```
#### Removelast

```
  POST /removelast
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `string` | `string` | **Required**. The string to manipulate |
| `count` | `integer` | **Required**. How many characters of the string to omit from the end of the string |

```
  Example:
  string = "This is a test"
  count = 4

  Result = "This is a "
```
#### Getsubstring

```
  POST /getsubstring
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `string` | `string` | **Required**. The string to manipulate |
| `start` | `integer` | **Required**. Specifies the start of the string to return |
| `end` | `integer` | **Optional**. Specifies the end of the string to return. If not used, will return until the end of the string |

```
  Example:
  string = "This is a test"
  start = 6
  end = 9

  Result = "is a"
```
#### Timestamp

```
  POST /timestamp
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `date` | `string` | **Required**. The date in DD/MM/YYYY format |
| `time` | `string` | **Required**. The time in format of 13:00 OR 1PM. Both will work |

```
  Example:
  date = 12/06/2023
  time = 13:00

  Result = "1686571200"
```
