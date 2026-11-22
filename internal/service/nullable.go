package service

import "encoding/json"

// Nullable distinguishes a JSON patch field that is absent (Set=false, leave
// the stored value untouched) from one explicitly sent as null (Set=true with
// Val=nil, clear the stored value). A plain *T cannot express "clear": both an
// omitted key and null decode to nil.
type Nullable[T any] struct {
	Set bool
	Val *T
}

func (n *Nullable[T]) UnmarshalJSON(data []byte) error {
	n.Set = true
	if string(data) == "null" {
		n.Val = nil
		return nil
	}
	var v T
	if err := json.Unmarshal(data, &v); err != nil {
		return err
	}
	n.Val = &v
	return nil
}

// MarshalJSON emits null for absent/cleared values so echoing an input back
// never turns a missing field into the Go zero value.
func (n Nullable[T]) MarshalJSON() ([]byte, error) {
	if !n.Set || n.Val == nil {
		return []byte("null"), nil
	}
	return json.Marshal(*n.Val)
}
