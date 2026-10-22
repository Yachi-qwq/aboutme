(module
  (memory (export "memory") 1)
  (data (i32.const 0) "Made by Yachi.")
  (func (export "footer_ptr") (result i32)
    i32.const 0)
  (func (export "footer_len") (result i32)
    i32.const 14)
)
